"use client";

import { useState } from "react";
import type { Candidate } from "@/types/candidate";
import { ISSUES } from "@/lib/issues_new";

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

function matchColor(score: number): string {
  if (score >= 70) return "text-green-600 dark:text-green-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}


function MatchRing({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const isGood = score >= 70;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--groove)" strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isGood ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444"}
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className={`absolute text-xs font-bold tabular-nums ${matchColor(score)}`}>
        {score}%
      </span>
    </div>
  );
}

export function MatchRingSmall({ score }: { score: number }) {
  const size = 44;
  const radius = (size - 5) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const isGood = score >= 70;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--groove)" strokeWidth={2.5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isGood ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444"}
          strokeWidth={2.5}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute text-[10px] font-bold tabular-nums ${matchColor(score)}`}>
        {score}%
      </span>
    </div>
  );
}

const TAG_LABELS: Record<string, string> = {
  foreign_policy: "Foreign Policy",
  immigration: "Immigration",
  economy: "Economy",
  healthcare: "Healthcare",
  legal_constitutional: "Legal & Constitutional",
  technology: "Technology",
  social_cultural: "Social & Cultural",
};

export function CandidateDetail({ candidate }: { candidate: Candidate }) {
  // Group issues by primary tag
  const tagGroups: Record<string, typeof ISSUES> = {};
  for (const issue of ISSUES) {
    const tag = issue.tags[0];
    if (!tagGroups[tag]) tagGroups[tag] = [];
    tagGroups[tag].push(issue);
  }

  return (
    <div className="flex flex-col gap-4">
      {candidate.summary && (
        <p className="rounded-lg bg-groove/60 px-3.5 py-3 text-xs leading-relaxed text-ink-dim">
          {candidate.summary}
        </p>
      )}
      {Object.entries(tagGroups).map(([tag, issues]) => {
        const issuesWithPositions = issues.filter(
          (i) => candidate.positions[i.key] !== undefined && candidate.positions[i.key] !== null
        );
        if (issuesWithPositions.length === 0) return null;

        return (
          <div key={tag} className="flex flex-col gap-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              {TAG_LABELS[tag] ?? tag}
            </h4>
            <div className="flex flex-col gap-1.5">
              {issuesWithPositions.map((issue) => {
                const idx = candidate.positions[issue.key];
                const positionText = idx !== null && idx !== undefined ? issue.positions[idx] : null;
                if (!positionText) return null;

                return (
                  <div key={issue.key} className="flex flex-col gap-1 rounded-lg border border-edge/60 bg-surface px-3 py-2">
                    <span className="text-[10px] font-medium text-ink-faint leading-snug">
                      {issue.description}
                    </span>
                    <span className="text-xs leading-snug text-ink-dim">
                      {positionText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CandidateCard({ candidate }: { candidate: Candidate }) {
  const [expanded, setExpanded] = useState(false);
  const score = candidate.match_score;
  const hasScore = score !== null;
  const isGood = hasScore && score >= 70;
  const style = partyStyle(candidate.party);

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-edge bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-groove/50"
      >
        <div className="flex items-center gap-3.5">
          {hasScore ? (
            <MatchRing score={score} />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-edge">
              <span className="text-xs font-medium text-ink-ghost">?</span>
            </div>
          )}

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
          {hasScore && (
            <span
              className={`rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide ${
                isGood
                  ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
              }`}
            >
              {isGood ? "Strong Match" : score >= 40 ? "Partial Match" : "Low Match"}
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
