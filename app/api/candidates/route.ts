import { NextRequest, NextResponse } from "next/server";
import {
  getCandidateSummariesBatch,
  getCandidatePositionsBatch,
  upsertCandidateSummary,
  upsertCandidatePositions,
} from "@/lib/db";
import { researchCandidates } from "@/lib/perplexity";
import { analyzePositionsBatch } from "@/lib/ai";
import { computeMatchScore } from "@/lib/match";
import type { Candidate } from "@/types/candidate";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

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

async function enrichCandidates(
  fecCandidates: Candidate[],
  userPositions: Record<string, number>
): Promise<Candidate[]> {
  const ids = fecCandidates.map((c) => c.candidate_id);
  const [summaryMap, positionsMap] = await Promise.all([
    getCandidateSummariesBatch(ids),
    getCandidatePositionsBatch(ids),
  ]);

  const staleThreshold = Date.now() - SIX_MONTHS_MS;
  const needsResearch: Candidate[] = [];

  const withDbData: Candidate[] = fecCandidates.map((c) => {
    const summary = summaryMap.get(c.candidate_id);
    const positions = positionsMap.get(c.candidate_id) ?? {};

    if (summary?.blacklist) {
      return {
        ...c,
        summary: "This candidate has been blacklisted.",
        blacklist: true,
        positions: {},
        match_score: null,
        positions_last_updated: summary.positions_last_updated,
      };
    }

    const isStale =
      !summary?.positions_last_updated ||
      new Date(summary.positions_last_updated).getTime() < staleThreshold;

    if (isStale) needsResearch.push(c);

    const match_score = computeMatchScore(userPositions, positions);

    return {
      ...c,
      summary: summary?.summary ?? null,
      blacklist: false,
      positions,
      match_score,
      positions_last_updated: summary?.positions_last_updated ?? null,
    };
  });

  if (needsResearch.length === 0) return withDbData;

  // Research with Perplexity, then score with Claude
  const researchMap = await researchCandidates(needsResearch);
  const analysisMap = await analyzePositionsBatch(needsResearch, researchMap);

  await Promise.all(
    needsResearch.map(async (candidate) => {
      const positions = analysisMap.get(candidate.candidate_id);
      if (!positions) return;
      await Promise.all([
        upsertCandidateSummary(candidate.candidate_id, candidate.name, null),
        upsertCandidatePositions(candidate.candidate_id, positions),
      ]);
    })
  );

  return withDbData.map((c) => {
    const positions = analysisMap.get(c.candidate_id);
    if (!positions) return c;
    return {
      ...c,
      positions,
      match_score: computeMatchScore(userPositions, positions),
      positions_last_updated: new Date(),
    };
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { state, lat, lon, userPositions = {} } = body as {
    state: string;
    lat: number;
    lon: number;
    userPositions?: Record<string, number>;
  };

  if (!state) {
    return NextResponse.json({ error: "state is required" }, { status: 400 });
  }
  if (lat === undefined || lon === undefined) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const district = (await fetchDistrict(lon, lat)) ?? "00";
  const fecData = await fetchCandidatesInDistrict(state, district);
  const fecCandidates: Candidate[] = fecData.results ?? [];
  const results = await enrichCandidates(fecCandidates, userPositions);

  return NextResponse.json({ results }, { status: 200 });
}
