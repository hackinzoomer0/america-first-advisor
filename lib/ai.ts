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
    `- "${issue.key}_stance": Write 1–2 sentences of flowing prose (no lists, no numbered points, no JSON). Describe what the candidate has actually said or done on this topic — name specific votes, bills, or statements. Address each of the criteria in [${issue.key}] by describing their position on that issue directly, not by referring to criterion numbers (the reader cannot see the criteria). Example: "Has called for deporting all illegal immigrants, not just criminals, and supports ending birthright citizenship, but has not taken a position on a legal immigration moratorium and generally supports H-1B visas." Set to null only if this candidate has no documented public record on this topic.`,
    `- "${issue.key}_score": An integer 1–10 following the scoring rules in [${issue.key}] exactly. Apply any hard caps or automatic FAILs as specified. Base the score only on the candidate's actual documented positions — do not guess based on party affiliation or district alone. Set to null if the candidate has no documented positions on this topic.`,
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
- "summary": 2–3 sentences. Start with a brief description of the candidate's general political identity, then explicitly call out the most notable ways they align with or diverge from the evaluation criteria — for example, if they support Israel, say so; if they only support deporting criminals rather than all illegal immigrants, say so. Be specific, not vague.
${ISSUE_FIELDS}

Candidates:
${candidateList}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.5,
    },
  });

  const raw: (CandidateAnalysis & { candidate_id: string })[] = JSON.parse(response.text ?? "[]");
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
