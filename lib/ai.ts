import Anthropic from "@anthropic-ai/sdk";
import { ISSUES } from "@/lib/issues";
import type { CandidateResearch } from "@/lib/perplexity";

if (!process.env.CLAUDE_API_KEY) {
  throw new Error("CLAUDE_API_KEY is not set");
}

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const OFFICE_LABELS: Record<string, string> = {
  S: "U.S. Senate",
  H: "U.S. House of Representatives",
  P: "President of the United States",
};

export type CandidateAnalysis = {
  summary: string;
} & {
  [K in `${string}_stance`]: string | null;
} & {
  [K in `${string}_score`]: number | null;
};

interface CandidateInput {
  candidate_id: string;
  name: string;
  office: "S" | "H" | "P";
  state: string;
}

// Build static blocks once — reused across every batch call.
const CRITERIA_BLOCK = ISSUES.map(
  (issue) => `[${issue.key}]\n${issue.standard}`
).join("\n\n");

const ISSUE_FIELDS = ISSUES.map((issue) =>
  [
    `- "${issue.key}_stance": 1–2 sentences of prose. Describe what the candidate has actually said or done — name specific votes, bills, or statements. Address each criterion in [${issue.key}] directly. null if no documented record.`,
    `- "${issue.key}_score": Integer 1–10 per [${issue.key}] rules. Apply hard caps/FAILs exactly. null if no documented positions.`,
  ].join("\n")
).join("\n");

export async function analyzeCandidatesBatch(
  candidates: CandidateInput[],
  researchMap: Map<string, CandidateResearch>
): Promise<Map<string, CandidateAnalysis>> {
  if (candidates.length === 0) return new Map();

  const candidateBlocks = candidates
    .map((c) => {
      const research = researchMap.get(c.candidate_id);
      const researchBlock = ISSUES.map((issue) => {
        const key = `${issue.key}_research` as keyof CandidateResearch;
        const text = research?.[key] ?? null;
        return `[Research: ${issue.key}]\n${text ?? "No research available."}`;
      }).join("\n\n");

      return (
        `CANDIDATE: ${c.name} | ${OFFICE_LABELS[c.office]} | ${c.state} | ID: ${c.candidate_id}\n` +
        researchBlock
      );
    })
    .join("\n\n---\n\n");

  const prompt =
    `You are a neutral political analyst. Based ONLY on the research provided for each candidate, ` +
    `return a JSON array — one object per candidate, in the same order.\n\n` +
    `EVALUATION CRITERIA:\n${CRITERIA_BLOCK}\n\n` +
    `Each object must include:\n` +
    `- "candidate_id": the exact ID provided\n` +
    `- "summary": 2–3 sentences describing the candidate's general positions in plain language. Do NOT mention criterion numbers, cite specific incidents, or frame things as "unmet criteria". Instead, describe what the candidate actually believes — e.g. "generally opposes foreign aid but has no documented position on aid to Israel". Call out gaps in the record plainly.\n` +
    `${ISSUE_FIELDS}\n\n` +
    `CANDIDATES:\n${candidateBlocks}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: Math.min(8192, candidates.length * 600 + 512),
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  const text = textBlock?.text ?? "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const raw: (CandidateAnalysis & { candidate_id: string })[] = JSON.parse(
    jsonMatch?.[0] ?? "[]"
  );

  const results = raw.map((r) => {
    const rounded = { ...r } as Record<string, unknown>;
    for (const key of Object.keys(rounded)) {
      if (key.endsWith("_score") && typeof rounded[key] === "number") {
        rounded[key] = Math.round(rounded[key] as number);
      }
    }
    return rounded as CandidateAnalysis & { candidate_id: string };
  });

  return new Map(results.map((r) => [r.candidate_id, r]));
}
