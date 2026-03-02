import { GoogleGenAI } from "@google/genai";
import { ISSUES } from "@/lib/issues";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

const CRITERIA_BLOCK = ISSUES.map(
  (issue) => `[${issue.key}]\n${issue.standard}`
).join("\n\n");

const ISSUE_FIELDS = ISSUES.map((issue) =>
  [
    `- "${issue.key}_stance": Using the [${issue.key}] criteria above as your guide, describe the candidate's documented positions in natural prose, explicitly addressing each point. Do not quote or reference the criteria — just describe where the candidate stands on each point. Set to null if you have no reliable information.`,
    `- "${issue.key}_score": An integer 1-10 rating of how aligned the candidate's positions are with the [${issue.key}] criteria above (10 = strongly agrees with all points, 1 = strongly opposes all points). Set to null if you have no reliable information.`,
  ].join("\n")
).join("\n");

export async function analyzeCandidatesBatch(
  candidates: CandidateInput[]
): Promise<Map<string, CandidateAnalysis>> {
  if (candidates.length === 0) return new Map();

  const candidateList = candidates
    .map((c) => `- ID: ${c.candidate_id} | ${c.name} | ${OFFICE_LABELS[c.office]} | ${c.state}`)
    .join("\n");

  const prompt = `You are a neutral political analyst. Analyze the following political candidates and return a JSON array — one object per candidate, in the same order.

EVALUATION CRITERIA:
${CRITERIA_BLOCK}

Each object must include:
- "candidate_id": the exact ID provided
- "summary": A 1-2 sentence neutral overview of the candidate's general political positions.
${ISSUE_FIELDS}

Candidates:
${candidateList}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const results: (CandidateAnalysis & { candidate_id: string })[] = JSON.parse(response.text ?? "[]");
  return new Map(results.map((r) => [r.candidate_id, r]));
}
