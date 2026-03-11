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

const PHASE_CONFIG: Record<Exclude<LoadingPhase, null>, { label: string; sublabel: string }> = {
  finding: {
    label: "Finding candidates in your district",
    sublabel: "Searching electoral databases...",
  },
  analyzing: {
    label: "Analyzing candidate positions",
    sublabel: "AI research in progress...",
  },
};

function LoadingIndicator({ phase }: { phase: Exclude<LoadingPhase, null> }) {
  const config = PHASE_CONFIG[phase];
  
  return (
    <div className="flex flex-col items-center gap-6 py-20">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-2 border-groove" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-base font-semibold text-ink">{config.label}</p>
        <p className="text-sm text-ink-faint">{config.sublabel}</p>
      </div>
      <p className="text-xs text-ink-ghost">
        First-time lookups may take up to 60 seconds
      </p>
    </div>
  );
}

function USAIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

export default function Home() {
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [userPositions, setUserPositions] = useState<Record<string, number>>({});
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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
      
      // Scroll to results after a short delay
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } finally {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      setLoadingPhase(null);
    }
  }

  const answeredCount = Object.keys(userPositions).length;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Header accent stripe */}
      <div className="flex h-1 w-full">
        <div className="flex-1 bg-accent" />
        <div className="flex-1 bg-ink-ghost" />
        <div className="flex-1 bg-accent-blue" />
      </div>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 flex flex-col gap-12 md:px-8 md:py-16">
        {/* Hero Section */}
        <header className="flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <USAIcon className="h-4 w-4 text-accent" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-ink-faint">
              Civic Intelligence
            </span>
          </div>
          
          <div className="flex flex-col gap-4">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-ink md:text-5xl lg:text-[3.25rem]">
              America First{" "}
              <span className="text-accent">Advisor</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-ink-dim md:text-lg md:leading-relaxed">
              Share your positions on key issues, then enter your address to discover candidates 
              in your district who align with your values.
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-2 rounded-full bg-groove px-3 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-ink-dim">AI-Powered Analysis</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-groove px-3 py-1.5">
              <span className="text-xs font-medium text-ink-dim">Federal Elections</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-col gap-10">
          {/* Quiz Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-accent" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
                Step 1: Your Positions
              </h2>
            </div>
            <IssueQuiz onChange={handlePositionsChange} />
          </section>

          {/* Search Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-accent-blue" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
                Step 2: Find Candidates
              </h2>
            </div>
            
            <div className="flex flex-col gap-4">
              {answeredCount === 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3">
                  <svg className="h-5 w-5 shrink-0 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-ink-dim">
                    Answer at least one question above to get personalized match scores.
                  </p>
                </div>
              )}
              <AddressSearch onSubmit={handleSubmit} loading={loadingPhase !== null} />
            </div>
          </section>

          {/* Results Section */}
          <div ref={resultsRef}>
            {loadingPhase !== null ? (
              <LoadingIndicator phase={loadingPhase} />
            ) : candidates.length > 0 ? (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-1 rounded-full bg-success" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
                      Your Matches
                    </h2>
                  </div>
                  <span className="text-xs text-ink-faint">
                    {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} found
                  </span>
                </div>
                <CandidateResults candidates={candidates} />
              </section>
            ) : hasSearched && candidates.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-edge bg-card px-6 py-16">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-groove">
                  <svg className="h-7 w-7 text-ink-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="font-semibold text-ink">No Upcoming Elections</p>
                  <p className="text-sm text-ink-dim">
                    We couldn{"'"}t find any federal elections for this location at this time.
                  </p>
                </div>
              </div>
            ) : !hasSearched && loadingPhase === null ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-edge bg-groove/30 px-6 py-14">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface border border-edge">
                  <svg className="h-6 w-6 text-ink-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="font-medium text-ink-dim">Enter your address above</p>
                  <p className="text-sm text-ink-faint">
                    We{"'"}ll find candidates running in your district
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-edge bg-surface">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-6 md:px-8">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-ink">America First Advisor</p>
            <p className="text-xs text-ink-faint">AI-powered civic intelligence</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/hackinzoomer0/america-first-advisor"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-surface text-ink-faint transition-all hover:border-ink-ghost hover:text-ink-dim"
              aria-label="GitHub Repository"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href="https://buymeacoffee.com/hackinzoomer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 items-center gap-2 rounded-lg border border-edge bg-surface px-3 text-xs font-medium text-ink-dim transition-all hover:border-ink-ghost hover:text-ink"
              aria-label="Buy Me a Coffee"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.12.097-.015.326-.077.381.015.033.055.006.137-.016.197-.065.175-.143.348-.194.53l-.068.248-.088.342a.616.616 0 01-.085.22.77.77 0 01-.402.274c-.477.146-.961.265-1.449.36-.973.189-1.964.305-2.958.342a26.12 26.12 0 01-3.103-.089 15.737 15.737 0 01-1.578-.267c-.259-.058-.509-.134-.768-.188a.784.784 0 00-.432.003c-.255.077-.476.25-.603.488a.747.747 0 00-.036.555c.048.148.125.294.216.42.178.246.421.429.683.575.537.3 1.127.515 1.727.671.878.228 1.783.347 2.691.412 1.068.076 2.142.055 3.2-.103a16.76 16.76 0 001.886-.416.787.787 0 00.396-.233.748.748 0 00.141-.425l.012-.133.052-.437.15-1.268c.027-.23.052-.46.082-.689l.001-.008z" />
                <path d="M7.5 16.5c0 2.25 1.5 4.5 4.5 4.5s4.5-2.25 4.5-4.5" />
              </svg>
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
