export interface Issue {
  key: string;
  // Broad subtopics for evidence gathering — what Perplexity should research.
  // These are independent of the scoring standard so that changing thresholds
  // (e.g. user-defined criteria) doesn't require re-fetching research.
  researchTopics: string[];
  standard: string;
  weight?: number; // explicit weight; unweighted issues share the remainder equally
}

export const ISSUES: Issue[] = [
  {
    key: "immigration",
    researchTopics: [
      "deportation and immigration enforcement policy (criminal aliens vs. all illegal immigrants)",
      "birthright citizenship",
      "H-1B and other work visa programs",
      "legal immigration levels and caps",
    ],
    standard:
      `Evaluate the candidate against each of the following criteria:
1. Supports mass deportation of ALL illegal immigrants — not just criminal aliens, but all or nearly all. Candidates who only support deporting criminals FAIL this criterion.
2. Supports ending birthright citizenship.
3. Opposes H-1B and other work visa programs, and supports broader restrictions on legal immigration levels.
Scoring: 10 = all three met. Deduct 3 points for each unmet criterion. A candidate who supports deporting criminals only (not all illegal immigrants) scores no higher than 4 on criterion 1 alone.`,
    weight: 0.25,
  },
  {
    key: "foreign_policy",
    researchTopics: [
      "Iran policy and support for military action or war against Iran",
      "U.S. financial aid to Israel specifically, and foreign aid policy generally (including any stated opposition to all foreign aid)",
      "military interventionism and overseas military commitments",
    ],
    standard:
      `Evaluate the candidate against each of the following criteria:
1. Opposes war with Iran — a candidate who supports, hedges on, or has endorsed military action against Iran FAILS this criterion.
2. Opposes U.S. financial aid to Israel — any support for financial assistance to Israel is an automatic FAIL. A candidate who explicitly opposes all foreign aid with no Israel exception meets this criterion.
3. Opposes foreign military interventionism unless there is a clear, direct benefit to the United States — not a vague or speculative benefit, but a concrete one.
Scoring: Criterion 1 (Iran war) accounts for 50% of the score (5 points). A candidate who fails criterion 1 cannot score above 5. Of the remaining 5 points: criterion 2 (financial aid to Israel) is worth 1.5 points and criterion 3 (interventionism) is worth 3.5 points. 10 = all three met. Deduct accordingly for each unmet criterion.`,
    weight: 0.55,
  },
  {
    key: "social_policy",
    researchTopics: [
      "abortion policy (federal vs. state approach, and any exceptions)",
      "same-sex marriage",
      "transgender policy",
    ],
    standard:
      `Evaluate the candidate against each of the following criteria:
1. Supports a federal abortion ban — not a state-level approach. Candidates who say abortion is a "states' rights" issue FAIL this criterion.
2. Supports extremely limited or no exceptions to an abortion ban (e.g., no rape or incest exceptions, or at most a narrow life-of-the-mother exception).
3. Opposes same-sex marriage.
4. Supports laws prohibiting transgenderism at any age — medical, legal, or social.
Scoring: 10 = all four met. Deduct 2–3 points for each unmet criterion.`,
  },
  {
    key: "religion",
    researchTopics: [
      "America as a Christian nation",
      "non-Christians holding political office",
      "Christian nationalist language and framing",
      "religion in politics generally",
    ],
    standard:
      `Evaluate the candidate against each of the following criteria:
1. Explicitly identifies America as a Christian nation — not "Judeo-Christian," not broadly religious, but explicitly and specifically Christian.
2. Opposes non-Christians holding positions of significant political power.
3. Uses explicitly Christian nationalist language or framing — general religiosity or references to "faith" or "God" without specifically Christian framing do NOT meet this criterion.
Scoring: 10 = all three met. A candidate who is merely religious or uses generic faith language scores no higher than 3. Deduct 3 points for each unmet criterion.`,
  },
];

// Build the weight map once: explicit weights first, then distribute remainder evenly.
const _explicitTotal = ISSUES.reduce((sum, i) => sum + (i.weight ?? 0), 0);
const _unweightedCount = ISSUES.filter((i) => i.weight === undefined).length;
const _perUnweighted = _unweightedCount > 0 ? (1 - _explicitTotal) / _unweightedCount : 0;

export const ISSUE_WEIGHTS: Record<string, number> = Object.fromEntries(
  ISSUES.map((i) => [i.key, i.weight ?? _perUnweighted])
);

/**
 * Computes the weighted average total score from an object that contains
 * `{key}_score` fields (e.g. immigration_score, israel_score).
 * Null/undefined scores are excluded and their weight redistributed.
 */
export function computeTotalScore(details: object): number | null {
  const d = details as Record<string, unknown>;
  let weightedSum = 0;
  let totalWeight = 0;

  for (const issue of ISSUES) {
    const score = d[`${issue.key}_score`];
    if (typeof score === "number") {
      weightedSum += score * ISSUE_WEIGHTS[issue.key];
      totalWeight += ISSUE_WEIGHTS[issue.key];
    }
  }

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : null;
}
