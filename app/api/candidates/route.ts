import { NextRequest, NextResponse } from "next/server";
import {
  getCandidateDetailsBatch,
  upsertCandidateDetails,
  updateScores,
  updateTotalScore,
  type CandidateAiDetails,
} from "@/lib/db";
import { researchCandidates } from "@/lib/perplexity";
import { analyzeCandidatesBatch } from "@/lib/ai";
import { ISSUES, computeTotalScore } from "@/lib/issues";
import type { Candidate } from "@/types/candidate";

const BLACKLIST_MSG = "This candidate has been blacklisted.";

// Research is expensive (Perplexity calls) — refresh every 6 months.
const RESEARCH_STALE_MS = 6 * 30 * 24 * 60 * 60 * 1000;
// Scores are cheap to recompute from cached research — refresh every 3 months
// or whenever criteria change (future: criteria hash).
const SCORE_STALE_MS = 3 * 30 * 24 * 60 * 60 * 1000;

async function fetchDistrict(longitude: number, latitude: number): Promise<string | null> {
  const params = new URLSearchParams({
    x: longitude.toString(),
    y: latitude.toString(),
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    layers: "Congressional Districts",
    format: "json",
  });

  const res = await fetch(
    `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?${params}`
  );
  const data = await res.json();

  const districts: { CD119?: string }[] =
    data?.result?.geographies?.["119th Congressional Districts"] ?? [];

  return districts[0]?.CD119 ?? null;
}

async function fetchCandidatesInDistrict(state: string, district: string) {
  const params = new URLSearchParams({
    page: "1",
    per_page: "50",
    is_active_candidate: "true",
    election_year: new Date().getFullYear().toString(),
    state,
    sort: "name",
    sort_hide_null: "false",
    sort_null_only: "false",
    sort_nulls_last: "false",
    api_key: process.env.FEC_API_KEY ?? "DEMO_KEY",
  });
  params.append("district", "00");
  params.append("district", district);
  params.append("candidate_status", "C");
  params.append("candidate_status", "F");

  const res = await fetch(`https://api.open.fec.gov/v1/candidates/search/?${params}`);
  return await res.json();
}

async function enrichCandidates(fecCandidates: Candidate[]): Promise<Candidate[]> {
  const detailsMap = await getCandidateDetailsBatch(fecCandidates.map((c) => c.candidate_id));

  const now = Date.now();
  const researchStaleThreshold = now - RESEARCH_STALE_MS;
  const scoreStaleThreshold = now - SCORE_STALE_MS;

  // Candidates that need fresh Perplexity research
  const needsResearch: Candidate[] = [];
  // Candidates that have fresh research but need re-scoring (e.g. criteria changed)
  const needsScoreOnly: Candidate[] = [];
  const scoreUpdates: Promise<void>[] = [];

  const withDbData: Candidate[] = fecCandidates.map((c) => {
    const details = detailsMap.get(c.candidate_id);

    if (details?.blacklist) {
      const blacklistIssueFields = Object.fromEntries(
        ISSUES.flatMap((issue) => [
          [`${issue.key}_position`, BLACKLIST_MSG],
          [`${issue.key}_score`, 0],
        ])
      );
      return {
        ...c,
        ...blacklistIssueFields,
        summary: BLACKLIST_MSG,
        total_score: 0,
        blacklist: true,
        last_updated: details.score_last_updated,
      } as Candidate;
    }

    const researchStale =
      !details?.research_last_updated ||
      new Date(details.research_last_updated).getTime() < researchStaleThreshold;

    const scoreStale =
      !details?.score_last_updated ||
      new Date(details.score_last_updated).getTime() < scoreStaleThreshold;

    if (researchStale) {
      needsResearch.push(c);
    } else if (scoreStale) {
      needsScoreOnly.push(c);
    }

    const liveScore = details ? computeTotalScore(details) : null;

    if (details && !researchStale && !scoreStale && liveScore !== null && liveScore !== details.total_score) {
      scoreUpdates.push(updateTotalScore(c.candidate_id, liveScore));
    }

    return {
      ...c,
      summary: details?.summary ?? null,
      immigration_position: details?.immigration_position ?? null,
      immigration_score: details?.immigration_score ?? null,
      foreign_policy_position: details?.foreign_policy_position ?? null,
      foreign_policy_score: details?.foreign_policy_score ?? null,
      social_policy_position: details?.social_policy_position ?? null,
      social_policy_score: details?.social_policy_score ?? null,
      religion_position: details?.religion_position ?? null,
      religion_score: details?.religion_score ?? null,
      total_score: liveScore,
      blacklist: false,
      last_updated: details?.score_last_updated ?? null,
    };
  });

  if (scoreUpdates.length > 0) Promise.all(scoreUpdates).catch(console.error);

  // --- Candidates needing full refresh (research + scoring) ---
  if (needsResearch.length > 0) {
    const researchMap = await researchCandidates(needsResearch);
    const analysisMap = await analyzeCandidatesBatch(needsResearch, researchMap);

    await Promise.all(
      needsResearch.map((candidate) => {
        const analysis = analysisMap.get(candidate.candidate_id);
        const research = researchMap.get(candidate.candidate_id);
        if (!analysis) return;
        const aiDetails: CandidateAiDetails = {
          summary: analysis.summary,
          immigration_research: research?.immigration_research ?? null,
          immigration_position: analysis.immigration_stance,
          immigration_score: analysis.immigration_score,
          foreign_policy_research: research?.foreign_policy_research ?? null,
          foreign_policy_position: analysis.foreign_policy_stance,
          foreign_policy_score: analysis.foreign_policy_score,
          social_policy_research: research?.social_policy_research ?? null,
          social_policy_position: analysis.social_policy_stance,
          social_policy_score: analysis.social_policy_score,
          religion_research: research?.religion_research ?? null,
          religion_position: analysis.religion_stance,
          religion_score: analysis.religion_score,
          total_score: computeTotalScore(analysis),
        };
        return upsertCandidateDetails(candidate.candidate_id, candidate.name, aiDetails);
      })
    );

    for (const c of withDbData) {
      const analysis = analysisMap.get(c.candidate_id);
      if (!analysis) continue;
      Object.assign(c, {
        summary: analysis.summary,
        immigration_position: analysis.immigration_stance,
        immigration_score: analysis.immigration_score,
        foreign_policy_position: analysis.foreign_policy_stance,
        foreign_policy_score: analysis.foreign_policy_score,
        social_policy_position: analysis.social_policy_stance,
        social_policy_score: analysis.social_policy_score,
        religion_position: analysis.religion_stance,
        religion_score: analysis.religion_score,
        total_score: computeTotalScore(analysis),
        last_updated: new Date(),
      });
    }
  }

  // --- Candidates with fresh research but stale scores (re-score only) ---
  if (needsScoreOnly.length > 0) {
    // Build a researchMap from the cached DB data
    const cachedResearchMap = new Map(
      needsScoreOnly.map((c) => {
        const details = detailsMap.get(c.candidate_id)!;
        return [
          c.candidate_id,
          {
            candidate_id: c.candidate_id,
            immigration_research: details.immigration_research,
            foreign_policy_research: details.foreign_policy_research,
            social_policy_research: details.social_policy_research,
            religion_research: details.religion_research,
          },
        ];
      })
    );

    const analysisMap = await analyzeCandidatesBatch(needsScoreOnly, cachedResearchMap);

    await Promise.all(
      needsScoreOnly.map((candidate) => {
        const analysis = analysisMap.get(candidate.candidate_id);
        if (!analysis) return;
        return updateScores(candidate.candidate_id, candidate.name, {
          summary: analysis.summary,
          immigration_position: analysis.immigration_stance,
          immigration_score: analysis.immigration_score,
          foreign_policy_position: analysis.foreign_policy_stance,
          foreign_policy_score: analysis.foreign_policy_score,
          social_policy_position: analysis.social_policy_stance,
          social_policy_score: analysis.social_policy_score,
          religion_position: analysis.religion_stance,
          religion_score: analysis.religion_score,
          total_score: computeTotalScore(analysis),
        });
      })
    );

    for (const c of withDbData) {
      const analysis = analysisMap.get(c.candidate_id);
      if (!analysis) continue;
      Object.assign(c, {
        summary: analysis.summary,
        immigration_position: analysis.immigration_stance,
        immigration_score: analysis.immigration_score,
        foreign_policy_position: analysis.foreign_policy_stance,
        foreign_policy_score: analysis.foreign_policy_score,
        social_policy_position: analysis.social_policy_stance,
        social_policy_score: analysis.social_policy_score,
        religion_position: analysis.religion_stance,
        religion_score: analysis.religion_score,
        total_score: computeTotalScore(analysis),
        last_updated: new Date(),
      });
    }
  }

  return withDbData;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const state = searchParams.get("state");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!state) {
    return NextResponse.json({ error: "state is required" }, { status: 400 });
  }

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const district = await fetchDistrict(parseFloat(lon), parseFloat(lat)) ?? "00";
  const fecData = await fetchCandidatesInDistrict(state, district);
  const fecCandidates: Candidate[] = fecData.results ?? [];
  const results = await enrichCandidates(fecCandidates);

  return NextResponse.json({ results }, { status: 200 });
}
