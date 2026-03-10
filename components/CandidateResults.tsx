"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import type { Candidate } from "@/types/candidate";
import {
  CandidateCard,
  CandidateDetail,
  MatchRingSmall,
  ChevronIcon,
  formatName,
  partyStyle,
} from "@/components/CandidateCard";

interface Props {
  candidates: Candidate[];
}

const PARTY_ORDER = ["DEM", "REP"];

function groupByParty(candidates: Candidate[]): [string, string, Candidate[]][] {
  const map = new Map<string, [string, Candidate[]]>();
  for (const c of candidates) {
    if (!map.has(c.party)) map.set(c.party, [c.party_full, []]);
    map.get(c.party)![1].push(c);
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      const ai = PARTY_ORDER.indexOf(a);
      const bi = PARTY_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    })
    .map(([party, [partyFull, cs]]) => [party, partyFull, cs]);
}

function TopCandidatePreview({ candidates, label = "Top candidate" }: { candidates: Candidate[]; label?: string }) {
  const [expanded, setExpanded] = useState(false);

  const top = [...candidates]
    .filter((c) => c.match_score !== null)
    .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))[0];

  if (!top || top.match_score === null) return null;

  const score = top.match_score;
  const isGood = score >= 70;
  const style = partyStyle(top.party);

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-edge bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-groove/50"
      >
        <div className="flex items-center gap-3.5">
          <MatchRingSmall score={score} />
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              {label}
            </span>
            <span className="font-semibold text-ink text-sm leading-tight">
              {formatName(top.name)}
            </span>
            <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {top.party_full}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide ${
              isGood
                ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
            }`}
          >
            {isGood ? "Strong Match" : score >= 40 ? "Partial Match" : "Low Match"}
          </span>
          <ChevronIcon expanded={expanded} />
        </div>
      </button>
      {expanded && (
        <div className="border-t border-edge px-4 py-4">
          <CandidateDetail candidate={top} />
        </div>
      )}
    </div>
  );
}

function PartyGroup({ party, partyFull, candidates }: { party: string; partyFull: string; candidates: Candidate[] }) {
  const [expanded, setExpanded] = useState(false);
  const style = partyStyle(party);

  const sorted = [...candidates].sort(
    (a, b) => (b.match_score ?? -Infinity) - (a.match_score ?? -Infinity)
  );

  return (
    <div className="flex flex-col gap-2.5">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2.5">
          <div className={`h-4 w-1 rounded-full ${style.dot}`} />
          <span className="text-xs font-bold uppercase tracking-widest text-ink-faint">
            {partyFull}
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-groove text-[10px] font-semibold text-ink-faint">
            {sorted.length}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-ink-faint group-hover:text-ink-dim transition-colors">
          {expanded ? "Collapse" : "See all"}
          <ChevronIcon expanded={expanded} />
        </span>
      </button>
      {!expanded && <TopCandidatePreview candidates={sorted} label={`Top ${partyFull} candidate`} />}
      {expanded && (
        <div className="flex flex-col gap-2.5">
          {sorted.map((c) => (
            <CandidateCard key={c.candidate_id} candidate={c} />
          ))}
        </div>
      )}
    </div>
  );
}

const OFFICE_ICONS: Record<string, ReactElement> = {
  Senate: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
    </svg>
  ),
  House: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  Presidential: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  ),
};

function CandidateSection({ title, candidates }: { title: string; candidates: Candidate[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!candidates.length) return null;
  const groups = groupByParty(candidates);

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
            {OFFICE_ICONS[title] ?? OFFICE_ICONS.Senate}
          </div>
          <h2 className="text-sm font-bold text-ink">
            {title}
          </h2>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-groove px-1.5 text-[10px] font-semibold text-ink-faint">
            {candidates.length}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-ink-faint group-hover:text-ink-dim transition-colors">
          {expanded ? "Collapse" : "See more"}
          <ChevronIcon expanded={expanded} />
        </span>
      </button>
      {!expanded && <TopCandidatePreview candidates={candidates} />}
      {expanded && (
        <div className="flex flex-col gap-6">
          {groups.map(([party, partyFull, cs]) => (
            <PartyGroup key={party} party={party} partyFull={partyFull} candidates={cs} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CandidateResults({ candidates }: Props) {
  const senate = candidates.filter((c) => c.office === "S");
  const house = candidates.filter((c) => c.office === "H");
  const presidential = candidates.filter((c) => c.office === "P");

  return (
    <section className="flex flex-col gap-8">
      <CandidateSection title="Presidential" candidates={presidential} />
      <CandidateSection title="Senate" candidates={senate} />
      <CandidateSection title="House" candidates={house} />
    </section>
  );
}
