import { NextRequest, NextResponse } from "next/server";
import { getCandidateDetailsBatch, upsertCandidateDetails, updateTotalScore, type CandidateAiDetails } from "@/lib/db";
import { analyzeCandidatesBatch } from "@/lib/ai";
import { ISSUES, computeTotalScore } from "@/lib/issues";
import type { Candidate } from "@/types/candidate";

const BLACKLIST_MSG = "This candidate has been blacklisted.";

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

const THREE_MONTHS_AGO_MS = 3 * 30 * 24 * 60 * 60 * 1000;

async function enrichCandidates(fecCandidates: Candidate[]): Promise<Candidate[]> {
  const detailsMap = await getCandidateDetailsBatch(fecCandidates.map((c) => c.candidate_id));

  const staleThreshold = Date.now() - THREE_MONTHS_AGO_MS;
  const needsAnalysis: Candidate[] = [];
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
        last_updated: details.last_updated,
      } as Candidate;
    }

    const isStale = details && new Date(details.last_updated).getTime() < staleThreshold;
    if (!details || isStale) needsAnalysis.push(c);

    const liveScore = details ? computeTotalScore(details) : null;

    // If weights changed, the stored total_score may be stale for fresh records.
    // Queue a lightweight update without blocking the response.
    if (details && !isStale && liveScore !== null && liveScore !== details.total_score) {
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
      last_updated: details?.last_updated ?? null,
    };
  });

  // Fire score patches without blocking
  if (scoreUpdates.length > 0) Promise.all(scoreUpdates).catch(console.error);

  if (needsAnalysis.length === 0) return withDbData;

  const analysisMap = await analyzeCandidatesBatch(needsAnalysis);

  await Promise.all(
    needsAnalysis.map((candidate) => {
      const analysis = analysisMap.get(candidate.candidate_id);
      if (!analysis) return;
      const aiDetails: CandidateAiDetails = {
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
      };
      return upsertCandidateDetails(candidate.candidate_id, candidate.name, aiDetails);
    })
  );

  return withDbData.map((c) => {
    const analysis = analysisMap.get(c.candidate_id);
    if (!analysis) return c;
    return {
      ...c,
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
    };
  });
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
