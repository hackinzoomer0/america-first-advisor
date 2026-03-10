import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = neon(process.env.DATABASE_URL);

// ── Candidate summary (name, summary, blacklist) ──────────────────────────────

export interface CandidateSummary {
  candidate_id: string;
  name: string;
  summary: string | null;
  blacklist: boolean;
  positions_last_updated: Date | null;
}

export async function upsertCandidateSummary(
  candidateId: string,
  name: string,
  summary: string | null
): Promise<void> {
  await sql`
    INSERT INTO candidate (candidate_id, name, summary, positions_last_updated)
    VALUES (${candidateId}, ${name}, ${summary}, NOW())
    ON CONFLICT (candidate_id) DO UPDATE SET
      name = EXCLUDED.name,
      summary = EXCLUDED.summary,
      positions_last_updated = NOW()
  `;
}

export async function getCandidateSummariesBatch(
  candidateIds: string[]
): Promise<Map<string, CandidateSummary>> {
  if (candidateIds.length === 0) return new Map();
  const rows = await sql`
    SELECT candidate_id, name, summary, blacklist, positions_last_updated
    FROM candidate
    WHERE candidate_id = ANY(${candidateIds})
  ` as CandidateSummary[];
  return new Map(rows.map((r) => [r.candidate_id, r]));
}

// ── Candidate positions (issue_key → position_idx) ───────────────────────────

export interface CandidatePositionRow {
  candidate_id: string;
  issue_key: string;
  position_idx: number | null;
}

export async function upsertCandidatePositions(
  candidateId: string,
  positions: Record<string, number | null>
): Promise<void> {
  const entries = Object.entries(positions);
  if (entries.length === 0) return;

  await Promise.all(
    entries.map(([issueKey, positionIdx]) =>
      sql`
        INSERT INTO candidate_positions (candidate_id, issue_key, position_idx, researched_at)
        VALUES (${candidateId}, ${issueKey}, ${positionIdx}, NOW())
        ON CONFLICT (candidate_id, issue_key) DO UPDATE SET
          position_idx = EXCLUDED.position_idx,
          researched_at = NOW()
      `
    )
  );
}

export async function getCandidatePositionsBatch(
  candidateIds: string[]
): Promise<Map<string, Record<string, number | null>>> {
  if (candidateIds.length === 0) return new Map();
  const rows = await sql`
    SELECT candidate_id, issue_key, position_idx
    FROM candidate_positions
    WHERE candidate_id = ANY(${candidateIds})
  ` as CandidatePositionRow[];

  const map = new Map<string, Record<string, number | null>>();
  for (const row of rows) {
    if (!map.has(row.candidate_id)) map.set(row.candidate_id, {});
    map.get(row.candidate_id)![row.issue_key] = row.position_idx;
  }
  return map;
}
