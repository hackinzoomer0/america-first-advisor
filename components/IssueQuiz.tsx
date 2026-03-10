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
  const groups = groupIssuesByTag();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">Your Positions</h2>
        <span className="text-xs text-ink-faint">
          {answeredCount}/{totalCount} answered
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-groove">
        <div
          className="h-1.5 rounded-full bg-accent transition-all duration-300"
          style={{ width: `${(answeredCount / totalCount) * 100}%` }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {TAG_ORDER.filter((tag) => groups[tag]?.length > 0).map((tag) => {
          const issues = groups[tag];
          const tagAnswered = issues.filter((i) => positions[i.key] !== undefined).length;
          const isOpen = openTag === tag;

          return (
            <div key={tag} className="overflow-hidden rounded-[var(--radius)] border border-edge bg-card">
              <button
                onClick={() => setOpenTag(isOpen ? null : tag)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-groove/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {TAG_LABELS[tag] ?? tag}
                  </span>
                  {tagAnswered === issues.length && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                      <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                <span className="text-xs text-ink-faint">
                  {tagAnswered}/{issues.length}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-edge px-4 py-3 flex flex-col gap-5">
                  {issues.map((issue) => {
                    const selected = positions[issue.key];
                    return (
                      <div key={issue.key} className="flex flex-col gap-2">
                        <p className="text-xs font-medium text-ink-dim leading-snug">
                          {issue.description}
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {issue.positions.map((position, idx) => {
                            const isSelected = selected === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => handleSelect(issue.key, idx)}
                                className={`rounded-lg border px-3 py-2 text-left text-xs leading-snug transition-colors ${
                                  isSelected
                                    ? "border-accent bg-accent/10 text-ink font-medium"
                                    : "border-edge bg-surface text-ink-dim hover:border-accent/40 hover:bg-groove/40"
                                }`}
                              >
                                {position}
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
