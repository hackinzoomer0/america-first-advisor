"use client";

import { useState, useEffect } from "react";
import { ISSUES } from "@/lib/issues_new";

const STORAGE_KEY = "afa_user_positions";

const TAG_LABELS: Record<string, string> = {
  foreign_policy: "Foreign Policy",
  immigration: "Immigration",
  economy: "Economy",
  healthcare: "Healthcare",
  legal_constitutional: "Legal & Constitutional",
  technology: "Technology",
  social_cultural: "Social & Cultural",
};

const TAG_ICONS: Record<string, React.ReactNode> = {
  foreign_policy: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
  immigration: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  economy: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  ),
  healthcare: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  legal_constitutional: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
    </svg>
  ),
  technology: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  ),
  social_cultural: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
};

const TAG_ORDER = [
  "foreign_policy",
  "immigration",
  "economy",
  "healthcare",
  "legal_constitutional",
  "technology",
  "social_cultural",
];

function groupIssuesByTag() {
  const groups: Record<string, typeof ISSUES> = {};
  for (const tag of TAG_ORDER) groups[tag] = [];
  for (const issue of ISSUES) {
    const primaryTag = TAG_ORDER.find((t) => issue.tags.includes(t)) ?? issue.tags[0];
    if (!groups[primaryTag]) groups[primaryTag] = [];
    groups[primaryTag].push(issue);
  }
  return groups;
}

interface Props {
  onChange: (positions: Record<string, number>) => void;
}

export function IssueQuiz({ onChange }: Props) {
  const [positions, setPositions] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [openTag, setOpenTag] = useState<string | null>(TAG_ORDER[0]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    } catch {
      // ignore
    }
    onChange(positions);
  }, [positions, onChange]);

  function handleSelect(issueKey: string, idx: number) {
    setPositions((prev) => ({ ...prev, [issueKey]: idx }));
  }

  const answeredCount = Object.keys(positions).length;
  const totalCount = ISSUES.length;
  const progressPercent = (answeredCount / totalCount) * 100;
  const groups = groupIssuesByTag();

  return (
    <div className="flex flex-col gap-5">
      {/* Progress Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-edge bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">Your Progress</span>
          <span className="text-sm font-medium tabular-nums text-ink-dim">
            {answeredCount} of {totalCount} questions
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-groove">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        {progressPercent === 100 && (
          <div className="flex items-center gap-2 text-success">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">All questions answered!</span>
          </div>
        )}
      </div>

      {/* Category Accordions */}
      <div className="flex flex-col gap-2">
        {TAG_ORDER.filter((tag) => groups[tag]?.length > 0).map((tag) => {
          const issues = groups[tag];
          const tagAnswered = issues.filter((i) => positions[i.key] !== undefined).length;
          const isOpen = openTag === tag;
          const isComplete = tagAnswered === issues.length;

          return (
            <div 
              key={tag} 
              className={`overflow-hidden rounded-xl border transition-colors ${
                isComplete 
                  ? "border-success/30 bg-success-soft" 
                  : isOpen 
                    ? "border-accent/30 bg-card" 
                    : "border-edge bg-card"
              }`}
            >
              <button
                onClick={() => setOpenTag(isOpen ? null : tag)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-groove/30"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    isComplete 
                      ? "bg-success/10 text-success" 
                      : "bg-groove text-ink-faint"
                  }`}>
                    {TAG_ICONS[tag]}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-ink">
                      {TAG_LABELS[tag] ?? tag}
                    </span>
                    <span className="text-xs text-ink-faint">
                      {tagAnswered} of {issues.length} answered
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isComplete && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success">
                      <svg className="h-3.5 w-3.5 text-canvas" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <svg
                    className={`h-5 w-5 text-ink-faint transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-edge/50 px-4 py-4 flex flex-col gap-6">
                  {issues.map((issue, issueIdx) => {
                    const selected = positions[issue.key];
                    const isAnswered = selected !== undefined;
                    
                    return (
                      <div key={issue.key} className="flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-groove text-xs font-bold text-ink-faint">
                            {issueIdx + 1}
                          </span>
                          <p className="text-sm font-medium leading-relaxed text-ink">
                            {issue.description}
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-2 pl-9">
                          {issue.positions.map((position, idx) => {
                            const isSelected = selected === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => handleSelect(issue.key, idx)}
                                className={`group relative flex items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-all ${
                                  isSelected
                                    ? "border-accent bg-accent-soft ring-1 ring-accent/20"
                                    : "border-edge bg-surface hover:border-accent/40 hover:bg-groove/40"
                                }`}
                              >
                                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                  isSelected 
                                    ? "border-accent bg-accent" 
                                    : "border-ink-ghost group-hover:border-accent/50"
                                }`}>
                                  {isSelected && (
                                    <svg className="h-3 w-3 text-canvas" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <span className={`text-sm leading-relaxed transition-colors ${
                                  isSelected ? "text-ink font-medium" : "text-ink-dim"
                                }`}>
                                  {position}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
