"use client";

import { useState } from "react";
import type { Candidate } from "@/types/candidate";

export function formatName(name: string): string {
  const [last, first] = name.split(", ");
  return [first, last]
    .filter(Boolean)
    .map((n) => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase())
    .join(" ");
}

const PARTY_STYLES: Record<string, { badge: string; dot: string }> = {
  DEM: {
    badge: "bg-blue-50 text-blue-700 ring-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/40",
    dot: "bg-blue-500",
  },
  REP: {
    badge: "bg-red-50 text-red-700 ring-red-200/60 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800/40",
    dot: "bg-red-500",
  },
};

const DEFAULT_PARTY_STYLE = {
  badge: "bg-groove text-ink-dim ring-edge",
  dot: "bg-ink-faint",
};

export function partyStyle(party: string) {
  return PARTY_STYLES[party] ?? DEFAULT_PARTY_STYLE;
}

export function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

const TOPICS: { label: string; scoreKey: keyof Candidate; positionKey: keyof Candidate }[] = [
  { label: "Immigration",    scoreKey: "immigration_score",    positionKey: "immigration_position" },
  { label: "Foreign Policy", scoreKey: "foreign_policy_score", positionKey: "foreign_policy_position" },
  { label: "Social Policy",  scoreKey: "social_policy_score",  positionKey: "social_policy_position" },
  { label: "Religion",       scoreKey: "religion_score",       positionKey: "religion_position" },
];

function scoreColor(score: number): string {
  if (score >= 7) return "text-green-600 dark:text-green-400";
  if (score >= 4) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBarColor(score: number): string {
  if (score >= 7) return "bg-green-500 dark:bg-green-400";
  if (score >= 4) return "bg-amber-500 dark:bg-amber-400";
  return "bg-red-500 dark:bg-red-400";
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const recommend = score >= 7;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--groove)"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={recommend ? "#22c55e" : "#ef4444"}
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className={`absolute text-sm font-bold tabular-nums ${scoreColor(score)}`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

export function CandidateDetail({ candidate }: { candidate: Candidate }) {
  const topics = TOPICS.map(({ label, scoreKey, positionKey }) => ({
    label,
    score: candidate[scoreKey] as number | null,
    position: candidate[positionKey] as string | null,
  }));

  return (
    <div className="flex flex-col gap-4">
      {candidate.summary && (
        <p className="rounded-lg bg-groove/60 px-3.5 py-3 text-xs leading-relaxed text-ink-dim">
          {candidate.summary}
        </p>
      )}
      <div className="flex flex-col gap-3">
        {topics.map(({ label, score, position }) => (
          <div key={label} className="flex flex-col gap-2 rounded-lg border border-edge/60 bg-surface px-3.5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                {label}
              </span>
              {score !== null ? (
                <span className={`text-sm font-bold tabular-nums ${scoreColor(score)}`}>
                  {score.toFixed(1)}<span className="text-ink-ghost font-normal">/10</span>
                </span>
              ) : (
                <span className="text-xs font-medium text-ink-ghost">N/A</span>
              )}
            </div>
            {score !== null && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-groove">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${scoreBarColor(score)}`}
                  style={{ width: `${score * 10}%` }}
                />
              </div>
            )}
            {score !== null && position ? (
              <p className="text-xs leading-relaxed text-ink-dim">
                {position}
              </p>
            ) : score === null ? (
              <p className="text-xs leading-relaxed text-ink-faint italic">
                Not enough data to evaluate this topic.
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CandidateCard({ candidate }: { candidate: Candidate }) {
  const [expanded, setExpanded] = useState(false);
  const score = candidate.total_score;
  const recommend = score !== null && score >= 7;
  const style = partyStyle(candidate.party);

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-edge bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-groove/50"
      >
        <div className="flex items-center gap-3.5">
          {/* Score ring */}
          {score !== null ? (
            <ScoreRing score={score} />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-edge">
              <span className="text-xs font-medium text-ink-ghost">?</span>
            </div>
          )}

          {/* Name + party */}
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-ink text-sm leading-tight">
              {formatName(candidate.name)}
            </span>
            <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {candidate.party_full}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {score !== null && (
            <span
              className={`rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide ${
                recommend
                  ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
              }`}
            >
              {recommend ? "Vote" : "Withhold"}
            </span>
          )}
          <ChevronIcon expanded={expanded} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-edge px-4 py-4">
          <CandidateDetail candidate={candidate} />
        </div>
      )}
    </div>
  );
}
