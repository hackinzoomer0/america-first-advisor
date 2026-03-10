import { ISSUES } from "@/lib/issues_new";

if (!process.env.PERPLEXITY_API_KEY) {
  throw new Error("PERPLEXITY_API_KEY is not set");
}

const PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions";
const MAX_CONCURRENT = 3;
const MAX_RETRIES = 4;
const RETRY_BASE_MS = 2000;

interface CandidateInput {
  candidate_id: string;
  name: string;
  office: "S" | "H" | "P";
  state: string;
}

const OFFICE_LABELS: Record<string, string> = {
  S: "U.S. Senate",
  H: "U.S. House of Representatives",
  P: "President of the United States",
};

const ISSUE_LIST = ISSUES.map(
  (issue) => `- ${issue.description}`
).join("\n");

async function withConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

async function researchCandidate(candidate: CandidateInput): Promise<string | null> {
  const prompt = `Research the political positions of ${candidate.name}, candidate for ${OFFICE_LABELS[candidate.office]} in ${candidate.state}.

Provide a detailed summary of their documented positions on each of the following topics. For each topic, cite specific votes, bills, speeches, campaign statements, or public records where available. Be thorough and specific.

Topics to cover:
${ISSUE_LIST}

Format your response as continuous prose organized by topic. Label each section clearly with the topic name.`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const res = await fetch(PERPLEXITY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4000,
        }),
      });

      if (res.status === 429) {
        lastError = new Error("Rate limited");
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Perplexity error ${res.status}: ${text}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content ?? null;
      return content;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (!lastError.message.includes("Rate limited")) {
        throw lastError;
      }
    }
  }

  console.error(`Failed to research ${candidate.name} after ${MAX_RETRIES + 1} attempts:`, lastError);
  return null;
}

export async function researchCandidates(
  candidates: CandidateInput[]
): Promise<Map<string, string | null>> {
  const tasks = candidates.map(
    (candidate) => () => researchCandidate(candidate).then((text) => ({ id: candidate.candidate_id, text }))
  );

  const results = await withConcurrencyLimit(tasks, MAX_CONCURRENT);
  return new Map(results.map(({ id, text }) => [id, text]));
}
