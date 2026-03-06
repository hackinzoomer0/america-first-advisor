import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = neon(process.env.DATABASE_URL);

export interface CandidateSummary {
  candidate_id: string;
  name: string;
  summary: string;
  research_last_updated: Date | null;
  score_last_updated: Date | null;
  immigration_research: string | null;
  immigration_position: string | null;
  immigration_score: number | null;
  foreign_policy_research: string | null;
  foreign_policy_position: string | null;
  foreign_policy_score: number | null;
  social_policy_research: string | null;
  social_policy_position: string | null;
  social_policy_score: number | null;
  religion_research: string | null;
  religion_position: string | null;
  religion_score: number | null;
  total_score: number | null;
  blacklist: boolean;
}

export interface CandidateAiDetails {
  summary: string;
  immigration_research: string | null;
  immigration_position: string | null;
  immigration_score: number | null;
  foreign_policy_research: string | null;
  foreign_policy_position: string | null;
  foreign_policy_score: number | null;
  social_policy_research: string | null;
  social_policy_position: string | null;
  social_policy_score: number | null;
  religion_research: string | null;
  religion_position: string | null;
  religion_score: number | null;
  total_score: number | null;
}

/** Full upsert — updates both research and scores. */
export async function upsertCandidateDetails(
  candidateId: string,
  name: string,
  details: CandidateAiDetails
): Promise<void> {
  await sql`
    INSERT INTO candidate (
      candidate_id, name, summary,
      immigration_research, immigration_position, immigration_score,
      foreign_policy_research, foreign_policy_position, foreign_policy_score,
      social_policy_research, social_policy_position, social_policy_score,
      religion_research, religion_position, religion_score,
      total_score, research_last_updated, score_last_updated
    ) VALUES (
      ${candidateId}, ${name}, ${details.summary},
      ${details.immigration_research}, ${details.immigration_position}, ${details.immigration_score},
      ${details.foreign_policy_research}, ${details.foreign_policy_position}, ${details.foreign_policy_score},
      ${details.social_policy_research}, ${details.social_policy_position}, ${details.social_policy_score},
      ${details.religion_research}, ${details.religion_position}, ${details.religion_score},
      ${details.total_score}, NOW(), NOW()
    )
    ON CONFLICT (candidate_id) DO UPDATE SET
      name = EXCLUDED.name,
      summary = EXCLUDED.summary,
      immigration_research = EXCLUDED.immigration_research,
      immigration_position = EXCLUDED.immigration_position,
      immigration_score = EXCLUDED.immigration_score,
      foreign_policy_research = EXCLUDED.foreign_policy_research,
      foreign_policy_position = EXCLUDED.foreign_policy_position,
      foreign_policy_score = EXCLUDED.foreign_policy_score,
      social_policy_research = EXCLUDED.social_policy_research,
      social_policy_position = EXCLUDED.social_policy_position,
      social_policy_score = EXCLUDED.social_policy_score,
      religion_research = EXCLUDED.religion_research,
      religion_position = EXCLUDED.religion_position,
      religion_score = EXCLUDED.religion_score,
      total_score = EXCLUDED.total_score,
      research_last_updated = NOW(),
      score_last_updated = NOW()
  `;
}

/** Lightweight score-only update — reuses existing research, does not touch research_last_updated. */
export async function updateScores(
  candidateId: string,
  name: string,
  details: Omit<CandidateAiDetails, `${string}_research`>
): Promise<void> {
  await sql`
    INSERT INTO candidate (
      candidate_id, name, summary,
      immigration_position, immigration_score,
      foreign_policy_position, foreign_policy_score,
      social_policy_position, social_policy_score,
      religion_position, religion_score,
      total_score, score_last_updated
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
      score_last_updated = NOW()
  `;
}

export async function updateTotalScore(
  candidateId: string,
  totalScore: number
): Promise<void> {
  await sql`
    UPDATE candidate
    SET total_score = ${totalScore}, score_last_updated = NOW()
    WHERE candidate_id = ${candidateId}
  `;
}

export async function getCandidateDetailsBatch(
  candidateIds: string[]
): Promise<Map<string, CandidateSummary>> {
  if (candidateIds.length === 0) return new Map();
  const rows = await sql`
    SELECT
      candidate_id, name, summary,
      research_last_updated, score_last_updated,
      immigration_research, immigration_position, immigration_score,
      foreign_policy_research, foreign_policy_position, foreign_policy_score,
      social_policy_research, social_policy_position, social_policy_score,
      religion_research, religion_position, religion_score,
      total_score, blacklist
    FROM candidate
    WHERE candidate_id = ANY(${candidateIds})
  ` as CandidateSummary[];
  return new Map(rows.map((r) => [r.candidate_id, r]));
}
