export interface Issue {
  key: string;
  standard: string;
  weight?: number; // explicit weight; unweighted issues share the remainder equally
}

export const ISSUES: Issue[] = [
  {
    key: "immigration",
    standard: "We need mass deportations of illegal immigrants. We should end birthright citizenship. " +
      "We should end asylum and refugee programs. Additionally, we need a full immigration moratorium. IMPORTANT: " +
      "The value for this should be based 70% on the candidate's stance on mass deportations, restricting legal " + 
      "immigration, and restricting H-1B visas.",
    weight: 0.30,
  },
  {
    key: "foreign_policy",
    standard: "America should only intervene internationally where it directly benefits us. We should use " +
      "foreign aid as a strategic tool rather than a handout. We should re-evaluate international commitments " +
      "to validate that they're in our best interest. America should not support Israel militarily or financially. " +
      "We should not have any special relationship with Israel. We should not have a pro-Israel foreign policy. " + 
      "IMPORTANT: 80% of the value for this should be based on the candidate's Israel stance, not their general foreign policy stance.",
      weight: 0.45,
  },
  {
    key: "social_policy",
    standard: "Abortion should be illegal at a federal level, and it should not be a states issue. " +
      "Exceptions should be extremely limited, if they exist at all. Homosexuality should have a negative stigma in society. " +
      "We should overturn gay marriage. Transgenderism should be illegal regardless of age.",
  },
  {
    key: "religion",
    standard: "America is a Christian nation. We should have Christian prayers in public schools. We should " +
      "not allow non-Christians to hold positions of power. America is explicitly Christian, not Judeo-Christian. " +
      "IMPORTANT: 40% of the value for this should be based on explicit Christian nationalism, not general religiosity.",
  }
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
