import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = neon(process.env.DATABASE_URL);

export interface CandidateSummary {
  candidate_id: string;
  name: string;
  summary: string;
  last_updated: Date;
  immigration_position: string | null;
  immigration_score: number | null;
  foreign_policy_position: string | null;
  foreign_policy_score: number | null;
  social_policy_position: string | null;
  social_policy_score: number | null;
  religion_position: string | null;
  religion_score: number | null;
  total_score: number | null;
  blacklist: boolean;
}

export interface CandidateAiDetails {
  summary: string;
  immigration_position: string | null;
  immigration_score: number | null;
  foreign_policy_position: string | null;
  foreign_policy_score: number | null;
  social_policy_position: string | null;
  social_policy_score: number | null;
  religion_position: string | null;
  religion_score: number | null;
  total_score: number | null;
}

export async function upsertCandidateDetails(
  candidateId: string,
  name: string,
  details: CandidateAiDetails
): Promise<void> {
  await sql`
    INSERT INTO candidate (
      candidate_id, name, summary,
      immigration_position, immigration_score,
      foreign_policy_position, foreign_policy_score,
      social_policy_position, social_policy_score,
      religion_position, religion_score,
      total_score, last_updated
    ) VALUES (
      ${candidateId}, ${name}, ${details.summary},
      ${details.immigration_position}, ${details.immigration_score},
      ${details.foreign_policy_position}, ${details.foreign_policy_score},
      ${details.social_policy_position}, ${details.social_policy_score},
      ${details.religion_position}, ${details.religion_score},
      ${details.total_score}, NOW()
    )
    ON CONFLICT (candidate_id) DO UPDATE SET
      name = EXCLUDED.name,
      summary = EXCLUDED.summary,
      immigration_position = EXCLUDED.immigration_position,
      immigration_score = EXCLUDED.immigration_score,
      foreign_policy_position = EXCLUDED.foreign_policy_position,
      foreign_policy_score = EXCLUDED.foreign_policy_score,
      social_policy_position = EXCLUDED.social_policy_position,
      social_policy_score = EXCLUDED.social_policy_score,
      religion_position = EXCLUDED.religion_position,
      religion_score = EXCLUDED.religion_score,
      total_score = EXCLUDED.total_score,
      last_updated = NOW()
  `;
}

export async function updateTotalScore(
  candidateId: string,
  totalScore: number
): Promise<void> {
  await sql`
    UPDATE candidate
    SET total_score = ${totalScore}
    WHERE candidate_id = ${candidateId}
  `;
}

export async function getCandidateDetailsBatch(
  candidateIds: string[]
): Promise<Map<string, CandidateSummary>> {
  if (candidateIds.length === 0) return new Map();
  const rows = await sql`
    SELECT
      candidate_id, name, summary, last_updated,
      immigration_position, immigration_score,
      foreign_policy_position, foreign_policy_score,
      social_policy_position, social_policy_score,
      religion_position, religion_score,
      total_score, blacklist
    FROM candidate
    WHERE candidate_id = ANY(${candidateIds})
  ` as CandidateSummary[];
  return new Map(rows.map((r) => [r.candidate_id, r]));
}
