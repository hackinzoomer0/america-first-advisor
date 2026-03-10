"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { CandidateResults } from "@/components/CandidateResults";
import { IssueQuiz } from "@/components/IssueQuiz";
import type { Candidate } from "@/types/candidate";

const AddressSearch = dynamic(
  () => import("@/components/AddressSearch").then((m) => m.AddressSearch),
  { ssr: false }
);

type LoadingPhase = "finding" | "analyzing" | null;

const PHASE_LABELS: Record<Exclude<LoadingPhase, null>, string> = {
  finding: "Finding candidates in your district...",
  analyzing: "Researching and analyzing candidates...",
};

function LoadingIndicator({ phase }: { phase: Exclude<LoadingPhase, null> }) {
  return (
    <div className="flex flex-col items-center gap-5 py-16">
      <div className="relative flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-edge" />
        <div className="absolute h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-sm font-medium text-ink">
          {PHASE_LABELS[phase]}
        </p>
        <p className="text-xs text-ink-faint">
          This may take up to 60 seconds for first-time lookups
        </p>
      </div>
    </div>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function Home() {
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [userPositions, setUserPositions] = useState<Record<string, number>>({});
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, []);

  const handlePositionsChange = useCallback((positions: Record<string, number>) => {
    setUserPositions(positions);
  }, []);

  async function handleSubmit(location: { lat: number; lon: number; stateCode: string | null }) {
    setLoadingPhase("finding");
    phaseTimerRef.current = setTimeout(() => setLoadingPhase("analyzing"), 2500);

    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: location.lat,
          lon: location.lon,
          state: location.stateCode,
          userPositions,
        }),
      });
      const data = await res.json();
      setCandidates(data.results ?? []);
      setHasSearched(true);
    } finally {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      setLoadingPhase(null);
    }
  }

  const answeredCount = Object.keys(userPositions).length;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Top accent line */}
      <div className="flex h-1 w-full">
        <div className="flex-1 bg-red-600" />
        <div className="flex-1 bg-ink-ghost" />
        <div className="flex-1 bg-accent-blue" />
      </div>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12 flex flex-col gap-10 md:px-8 md:py-16">
        {/* Header */}
        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <StarIcon className="h-5 w-5 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                Civic Intelligence
              </span>
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-ink md:text-5xl">
              America First{" "}
              <span className="text-accent">Advisor</span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-ink-dim">
              Tell us where you stand on the issues, then enter your address to find candidates
              in your district that match your positions.
            </p>
          </div>
        </header>

        {/* Divider */}
        <div className="h-px bg-edge" />

        {/* Quiz */}
        <IssueQuiz onChange={handlePositionsChange} />

        {/* Divider */}
        <div className="h-px bg-edge" />

        {/* Search */}
        <div className="flex flex-col gap-3">
          {answeredCount === 0 && (
            <p className="text-xs text-ink-faint text-center">
              Answer at least one question above to get personalized match scores.
            </p>
          )}
          <AddressSearch onSubmit={handleSubmit} loading={loadingPhase !== null} />
        </div>

        {/* First-search disclaimer */}
        {!hasSearched && loadingPhase === null && (
          <p className="text-xs text-ink-faint text-center">
            First-time searches for a district may take up to 60 seconds — AI research runs on demand.
          </p>
        )}

        {/* Results */}
        {loadingPhase !== null ? (
          <LoadingIndicator phase={loadingPhase} />
        ) : candidates.length > 0 ? (
          <CandidateResults candidates={candidates} />
        ) : hasSearched && candidates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-groove">
              <svg className="h-6 w-6 text-ink-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-ink-dim">
              No upcoming elections detected for this location.
            </p>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-edge bg-surface">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-5 md:px-8">
          <p className="text-xs text-ink-faint">
            America First Advisor
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/hackinzoomer0/america-first-advisor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-faint transition-colors hover:text-ink-dim"
              aria-label="GitHub Repository"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href="https://buymeacoffee.com/hackinzoomer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-faint transition-colors hover:text-ink-dim"
              aria-label="Buy Me a Coffee"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.12.097-.015.326-.077.381.015.033.055.006.137-.016.197-.065.175-.143.348-.194.53l-.068.248-.088.342a.616.616 0 01-.085.22.77.77 0 01-.402.274c-.477.146-.961.265-1.449.36-.973.189-1.964.305-2.958.342a26.12 26.12 0 01-3.103-.089 15.737 15.737 0 01-1.578-.267c-.259-.058-.509-.134-.768-.188a.784.784 0 00-.432.003c-.255.077-.476.25-.603.488a.747.747 0 00-.036.555c.048.148.125.294.216.42.178.246.421.429.683.575.537.3 1.127.515 1.727.671.878.228 1.783.347 2.691.412 1.068.076 2.142.055 3.2-.103a16.76 16.76 0 001.886-.416.787.787 0 00.396-.233.748.748 0 00.141-.425l.012-.133.052-.437.15-1.268c.027-.23.052-.46.082-.689l.001-.008z" />
                <path d="M7.5 16.5c0 2.25 1.5 4.5 4.5 4.5s4.5-2.25 4.5-4.5" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
