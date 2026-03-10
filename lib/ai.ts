import Anthropic from "@anthropic-ai/sdk";
import { ISSUES } from "@/lib/issues_new";

if (!process.env.CLAUDE_API_KEY) {
  throw new Error("CLAUDE_API_KEY is not set");
}

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const OFFICE_LABELS: Record<string, string> = {
  S: "U.S. Senate",
  H: "U.S. House of Representatives",
  P: "President of the United States",
};

interface CandidateInput {
  candidate_id: string;
  name: string;
  office: "S" | "H" | "P";
  state: string;
}

export type PositionMap = Record<string, number | null>;

const ISSUE_PROMPT = ISSUES.map((issue) => {
  const positionsList = issue.positions
    .map((p, i) => `  ${i}: "${p}"`)
    .join("\n");
  return `"${issue.key}" — ${issue.description}\nPositions:\n${positionsList}`;
}).join("\n\n");

async function selectPositions(
  candidate: CandidateInput,
  research: string
): Promise<PositionMap> {
  const prompt = `You are analyzing a political candidate's positions based on research.

Candidate: ${candidate.name} (${OFFICE_LABELS[candidate.office]}, ${candidate.state})

Research:
${research}

For each issue below, select the index (0-based) of the position that best matches the candidate's documented stance. Return a JSON object mapping each issue key to its index. Use null if there is genuinely no documented position.

Issues and positions:
${ISSUE_PROMPT}

Return only a JSON object like: {"iran_war": 3, "nato": 1, "deportations": null, ...}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error(`No JSON in Claude response for ${candidate.name}:`, text);
    return Object.fromEntries(ISSUES.map((i) => [i.key, null]));
  }

  const raw = JSON.parse(jsonMatch[0]) as Record<string, number | null>;

  // Clamp values to valid index range
  const result: PositionMap = {};
  for (const issue of ISSUES) {
    const val = raw[issue.key];
    if (val === null || val === undefined) {
      result[issue.key] = null;
    } else {
      result[issue.key] = Math.max(0, Math.min(issue.positions.length - 1, Math.round(val)));
    }
  }

  return result;
}

export async function analyzePositionsBatch(
  candidates: CandidateInput[],
  researchMap: Map<string, string | null>
): Promise<Map<string, PositionMap>> {
  const results = await Promise.all(
    candidates.map(async (candidate) => {
      const research = researchMap.get(candidate.candidate_id);
      if (!research) {
        return {
          id: candidate.candidate_id,
          positions: Object.fromEntries(ISSUES.map((i) => [i.key, null])) as PositionMap,
        };
      }
      const positions = await selectPositions(candidate, research);
      return { id: candidate.candidate_id, positions };
    })
  );

  return new Map(results.map(({ id, positions }) => [id, positions]));
}
