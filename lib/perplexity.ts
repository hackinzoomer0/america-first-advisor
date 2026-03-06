import { ISSUES, type Issue } from "@/lib/issues";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const TOKENS_PER_TOPIC = 1000;
// Max simultaneous Perplexity requests. Lower this if you hit rate limits.
const MAX_CONCURRENT = 3;
const MAX_RETRIES = 4;
const RETRY_BASE_MS = 2000; // doubles each attempt: 2s, 4s, 8s, 16s

if (!process.env.PERPLEXITY_API_KEY) {
  throw new Error("PERPLEXITY_API_KEY is not set");
}

const OFFICE_LABELS: Record<string, string> = {
  S: "U.S. Senate",
  H: "U.S. House of Representatives",
  P: "President of the United States",
};

export interface CandidateResearch {
  candidate_id: string;
  immigration_research: string | null;
  foreign_policy_research: string | null;
  social_policy_research: string | null;
  religion_research: string | null;
}

interface CandidateInput {
  candidate_id: string;
  name: string;
  office: "S" | "H" | "P";
  state: string;
}

/** Runs an array of async tasks with at most `limit` running at the same time. */
async function withConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker)
  );
  return results;
}

async function researchTopic(
  candidate: CandidateInput,
  issue: Issue
): Promise<string | null> {
  const officeLabel = OFFICE_LABELS[candidate.office];
  const topicList = issue.researchTopics.map((t) => `- ${t}`).join("\n");

  const prompt =
    `Research the documented policy positions of ${candidate.name}, running for ${officeLabel} in ${candidate.state}, on the following topics:\n${topicList}\n\n` +
    `List all documented statements, votes, and positions. Include direct quotes and cite sources where possible. ` +
    `Do not summarize — list individual items. If no documented record exists, say so.`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(PERPLEXITY_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [{ role: "user", content: prompt }],
          max_tokens: TOKENS_PER_TOPIC,
        }),
      });

      if (res.status === 429 && attempt < MAX_RETRIES) {
        const wait = RETRY_BASE_MS * 2 ** attempt;
        console.warn(`Perplexity rate limited for ${candidate.name} / ${issue.key}, retrying in ${wait}ms`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      if (!res.ok) {
        throw new Error(`Perplexity API error: ${res.status} ${await res.text()}`);
      }

      const data = await res.json();
      const text: string = data.choices?.[0]?.message?.content ?? "";
      return text.trim() || null;
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        const wait = RETRY_BASE_MS * 2 ** attempt;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      console.error(`Perplexity failed for ${candidate.name} / ${issue.key}:`, err);
      return null;
    }
  }
  return null;
}

export async function researchCandidates(
  candidates: CandidateInput[]
): Promise<Map<string, CandidateResearch>> {
  if (candidates.length === 0) return new Map();

  // Flatten every (candidate × issue) pair into a task list, then run at most
  // MAX_CONCURRENT at a time so we don't burst through Perplexity's rate limit.
  const pairs = candidates.flatMap((candidate) =>
    ISSUES.map((issue) => ({ candidate, issue }))
  );

  const results = await withConcurrencyLimit(
    pairs.map(({ candidate, issue }) => () => researchTopic(candidate, issue)),
    MAX_CONCURRENT
  );

  // Reassemble per-candidate research from the flat results array.
  const researchMap = new Map<string, CandidateResearch>();
  candidates.forEach((candidate, ci) => {
    researchMap.set(candidate.candidate_id, Object.fromEntries([
      ["candidate_id", candidate.candidate_id],
      ...ISSUES.map((issue, ii) => [
        `${issue.key}_research`,
        results[ci * ISSUES.length + ii],
      ]),
    ]) as CandidateResearch);
  });

  return researchMap;
}
