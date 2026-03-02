import { NextRequest, NextResponse } from "next/server";
import { getCandidateDetailsBatch, upsertCandidateDetails, updateTotalScore, type CandidateAiDetails } from "@/lib/db";
import { analyzeCandidatesBatch } from "@/lib/ai";
import { ISSUES, computeTotalScore } from "@/lib/issues";
import { fetchDistricts } from "@/lib/geocoder";
import { fetchCandidatesInDistrict } from "@/lib/federal";
import { scrapeStateElections, stateCodeToName, type StateElectionsResult } from "@/lib/states";
import type { Candidate } from "@/types/candidate";

const BLACKLIST_MSG = "This candidate has been blacklisted.";

const THREE_MONTHS_AGO_MS = 3 * 30 * 24 * 60 * 60 * 1000;

const BALLOTPEDIA_PARTY: Record<string, { party: string; party_full: string }> = {
  Democratic:  { party: "DEM", party_full: "Democratic" },
  Republican:  { party: "REP", party_full: "Republican" },
  Libertarian: { party: "LIB", party_full: "Libertarian" },
  Green:       { party: "GRN", party_full: "Green Party" },
  Unknown:     { party: "OTH", party_full: "Independent" },
};

const RACE_TYPE_OFFICE: Record<string, "E" | "SS" | "SH"> = {
  "governor":    "E",
  "state-senate": "SS",
  "state-house":  "SH",
};

const RACE_TYPE_FULL: Record<string, string> = {
  "governor":    "Governor",
  "state-senate": "State Senate",
  "state-house":  "State House",
};

function toIdSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function stateRacesToCandidates(
  races: StateElectionsResult["races"],
  stateCode: string
): Candidate[] {
  const candidates: Candidate[] = [];
  const year = new Date().getFullYear();

  for (const race of races) {
    const office = RACE_TYPE_OFFICE[race.type];
    const office_full = RACE_TYPE_FULL[race.type];
    for (const sc of race.candidates) {
      const { party, party_full } = BALLOTPEDIA_PARTY[sc.party] ?? { party: "OTH", party_full: sc.party };
      candidates.push({
        candidate_id: `bp_${stateCode.toLowerCase()}_${race.type}_${toIdSlug(sc.name)}`,
        name: sc.name,
        party,
        party_full,
        office,
        office_full,
        level: "state",
        incumbent_challenge_full: sc.incumbent ? "Incumbent" : "Challenger",
        state: stateCode,
        district: "",
        has_raised_funds: false,
        election_years: [year],
        last_updated: null,
        summary: null,
        immigration_position: null,
        immigration_score: null,
        foreign_policy_position: null,
        foreign_policy_score: null,
        social_policy_position: null,
        social_policy_score: null,
        religion_position: null,
        religion_score: null,
        total_score: null,
        blacklist: false,
      });
    }
  }

  return candidates;
}

async function enrichCandidates(candidates: Candidate[]): Promise<Candidate[]> {
  const detailsMap = await getCandidateDetailsBatch(candidates.map((c) => c.candidate_id));

  const staleThreshold = Date.now() - THREE_MONTHS_AGO_MS;
  const needsAnalysis: Candidate[] = [];
  const scoreUpdates: Promise<void>[] = [];

  const withDbData: Candidate[] = candidates.map((c) => {
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

  const stateName = stateCodeToName(state);
  const districts = await fetchDistricts(parseFloat(lon), parseFloat(lat));

  const stateElections = stateName
    ? await scrapeStateElections(stateName, new Date().getFullYear(), {
        senate: districts.stateSenate,
        house: districts.stateHouse,
      })
    : null;

  const fecData = await fetchCandidatesInDistrict(state, districts.congressional ?? "00");

  // Map FEC candidates: rename "P" (presidential) → "E" (executive) for unified office codes
  const fecCandidates: Candidate[] = (fecData.results ?? []).map((c: Candidate) => ({
    ...c,
    office: c.office === ("P" as Candidate["office"]) ? "E" : c.office,
    office_full: c.office === ("P" as Candidate["office"]) ? "President of the United States" : c.office_full,
    level: "federal" as const,
  }));

  const stateCandidates = stateElections
    ? stateRacesToCandidates(stateElections.races, state)
    : [];

  const [federal, stateResults] = await Promise.all([
    enrichCandidates(fecCandidates),
    enrichCandidates(stateCandidates),
  ]);

  return NextResponse.json({ federal, state: stateResults }, { status: 200 });
}
