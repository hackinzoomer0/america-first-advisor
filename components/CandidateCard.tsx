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

const PARTY_STYLES: Record<string, { badge: string; dot: string; ring: string }> = {
  DEM: {
    badge: "bg-accent-blue-soft text-accent-blue",
    dot: "bg-accent-blue",
    ring: "ring-accent-blue/20",
  },
  REP: {
    badge: "bg-accent-soft text-accent",
    dot: "bg-accent",
    ring: "ring-accent/20",
  },
};

const DEFAULT_PARTY_STYLE = {
  badge: "bg-groove text-ink-dim",
  dot: "bg-ink-faint",
  ring: "ring-edge",
};

export function partyStyle(party: string) {
  return PARTY_STYLES[party] ?? DEFAULT_PARTY_STYLE;
}

export function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-ink-faint transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
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

function getMatchConfig(score: number) {
  if (score >= 70) {
    return {
      color: "text-success",
      strokeColor: "#059669",
      bgColor: "bg-success-soft",
      label: "Strong Match",
    };
  }
  if (score >= 40) {
    return {
      color: "text-warning",
      strokeColor: "#d97706",
      bgColor: "bg-warning-soft",
      label: "Partial Match",
    };
  }
  return {
    color: "text-accent",
    strokeColor: "#dc2626",
    bgColor: "bg-accent-soft",
    label: "Low Match",
  };
}

function MatchRing({ score, size = 60 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const config = getMatchConfig(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          fill="none" 
          stroke="var(--groove)" 
          strokeWidth={4} 
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={config.strokeColor}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className={`absolute text-sm font-bold tabular-nums ${config.color}`}>
        {score}%
      </span>
    </div>
  );
}

export function MatchRingSmall({ score }: { score: number }) {
  const size = 48;
  const radius = (size - 5) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const config = getMatchConfig(score);

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
          stroke={config.strokeColor}
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className={`absolute text-xs font-bold tabular-nums ${config.color}`}>
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
  const tagGroups: Record<string, typeof ISSUES> = {};
  for (const issue of ISSUES) {
    const tag = issue.tags[0];
    if (!tagGroups[tag]) tagGroups[tag] = [];
    tagGroups[tag].push(issue);
  }

  return (
    <div className="flex flex-col gap-5">
      {candidate.summary && (
        <div className="flex items-start gap-3 rounded-lg bg-groove/60 p-4">
          <svg className="h-5 w-5 shrink-0 text-ink-faint mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p className="text-sm leading-relaxed text-ink-dim">
            {candidate.summary}
          </p>
        </div>
      )}
      
      {Object.entries(tagGroups).map(([tag, issues]) => {
        const issuesWithPositions = issues.filter(
          (i) => candidate.positions[i.key] !== undefined && candidate.positions[i.key] !== null
        );
        if (issuesWithPositions.length === 0) return null;

        return (
          <div key={tag} className="flex flex-col gap-3">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-faint">
              <div className="h-0.5 w-3 rounded-full bg-ink-ghost" />
              {TAG_LABELS[tag] ?? tag}
            </h4>
            <div className="flex flex-col gap-2">
              {issuesWithPositions.map((issue) => {
                const idx = candidate.positions[issue.key];
                const positionText = idx !== null && idx !== undefined ? issue.positions[idx] : null;
                if (!positionText) return null;

                return (
                  <div key={issue.key} className="flex flex-col gap-1.5 rounded-lg border border-edge bg-surface p-3">
                    <span className="text-xs font-medium text-ink-faint">
                      {issue.description}
                    </span>
                    <span className="text-sm leading-relaxed text-ink-dim">
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
  const style = partyStyle(candidate.party);
  const matchConfig = hasScore ? getMatchConfig(score) : null;

  return (
    <div className={`overflow-hidden rounded-xl border bg-card transition-all duration-200 ${
      expanded ? "border-edge shadow-lg" : "border-edge hover:border-ink-ghost hover:shadow-md"
    }`}>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-groove/30"
      >
        <div className="flex items-center gap-4">
          {hasScore ? (
            <MatchRing score={score} />
          ) : (
            <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-dashed border-edge">
              <span className="text-sm font-medium text-ink-ghost">?</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="font-semibold text-ink text-base leading-tight">
              {formatName(candidate.name)}
            </span>
            <span className={`inline-flex w-fit items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.badge} ${style.ring}`}>
              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
              {candidate.party_full}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasScore && matchConfig && (
            <span className={`hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${matchConfig.bgColor} ${matchConfig.color}`}>
              {matchConfig.label}
            </span>
          )}
          <ChevronIcon expanded={expanded} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-edge bg-surface/50 px-4 py-5">
          <CandidateDetail candidate={candidate} />
        </div>
      )}
    </div>
  );
}
