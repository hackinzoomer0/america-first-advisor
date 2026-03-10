import { ISSUES } from "@/lib/issues_new";
import type { PositionMap } from "@/lib/ai";

/**
 * Compute a 0–100 match score between user positions and a candidate's positions.
 * Uses normalized distance: score = 1 - (distance / max_distance) per issue, averaged.
 * Issues where either party has no position (null) are skipped.
 */
export function computeMatchScore(
  userPositions: Record<string, number>,
  candidatePositions: PositionMap
): number | null {
  let totalScore = 0;
  let count = 0;

  for (const issue of ISSUES) {
    const userIdx = userPositions[issue.key];
    const candidateIdx = candidatePositions[issue.key];

    if (userIdx === undefined || userIdx === null) continue;
    if (candidateIdx === undefined || candidateIdx === null) continue;

    const maxDist = issue.positions.length - 1;
    const dist = Math.abs(userIdx - candidateIdx);
    totalScore += 1 - dist / maxDist;
    count++;
  }

  if (count === 0) return null;
  return Math.round((totalScore / count) * 100);
}
