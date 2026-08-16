"use client";

import { useState } from "react";
import { ExplainTip } from "@/components/ui/ExplainTip";
import { explainCopy } from "@/helpers/explainCopy";
import type { BreakdownCategory } from "@/helpers/studentDashboardApi";

type Tab = "bloom" | "section" | "difficulty";

type BreakdownTabsProps = {
  bloomBreakdown: BreakdownCategory[];
  sectionBreakdown: BreakdownCategory[];
  difficultyBreakdown: BreakdownCategory[];
  viewerRole?: "learner" | "educator";
};

function masteryColor(scorePercent: number): string {
  if (scorePercent >= 70) return "#0ca30c";
  if (scorePercent >= 50) return "#fab219";
  return "#d03b3b";
}

function masteryLabel(scorePercent: number): string {
  if (scorePercent >= 70) return "On track";
  if (scorePercent >= 50) return "Developing";
  return "Requires focus";
}

function BreakdownBar({ item }: { item: BreakdownCategory }) {
  const pct = Math.min(100, Math.max(0, item.scorePercent));
  const color = masteryColor(pct);
  const label = masteryLabel(pct);
  const displayPct = Math.round(pct);

  return (
    <li className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-right text-sm font-medium text-ink sm:w-36">
        {item.categoryName}
      </span>
      <span className="relative flex h-7 flex-1 overflow-hidden rounded-full bg-border-ui">
        <span
          style={{ width: `${pct}%`, background: color }}
          className="h-full rounded-full transition-all duration-500"
        />
        {/* 70% target marker */}
        <span
          aria-hidden="true"
          style={{ left: "70%", background: "#5A5670" }}
          className="absolute inset-y-0 w-0.5 opacity-60"
        />
      </span>
      <span
        className="w-12 shrink-0 text-xs font-semibold"
        style={{ color }}
      >
        {displayPct}%
      </span>
      <span className="hidden w-24 shrink-0 text-xs text-text-secondary sm:block">
        {label}
      </span>
    </li>
  );
}

function weakest(categories: BreakdownCategory[]): BreakdownCategory | undefined {
  return categories
    .filter((c) => c.questionsAnswered > 0)
    .sort((a, b) => a.scorePercent - b.scorePercent)[0];
}

const tabFocusLabel: Record<Tab, string> = {
  bloom: "cognitive level",
  section: "section",
  difficulty: "difficulty",
};

export function BreakdownTabs({
  bloomBreakdown,
  sectionBreakdown,
  difficultyBreakdown,
  viewerRole = "learner",
}: BreakdownTabsProps) {
  const isEducator = viewerRole === "educator";
  const [activeTab, setActiveTab] = useState<Tab>("bloom");

  const tabs: { id: Tab; label: string }[] = [
    { id: "bloom", label: "By cognitive level" },
    { id: "section", label: "By section" },
    { id: "difficulty", label: "By difficulty" },
  ];

  const activeData: Record<Tab, BreakdownCategory[]> = {
    bloom: bloomBreakdown,
    section: sectionBreakdown,
    difficulty: difficultyBreakdown,
  };

  const currentCategories = activeData[activeTab];
  const weakestCategory = weakest(currentCategories);
  const needsFocus =
    weakestCategory !== undefined && weakestCategory.scorePercent < 70;

  return (
    <section aria-labelledby="breakdown-heading">
      <header className="flex items-center gap-2">
        <h2
          id="breakdown-heading"
          className="text-xl font-bold tracking-tight text-ink"
        >
          Performance breakdown
        </h2>
        <ExplainTip label="About the performance breakdown">
          {explainCopy.studentPerformanceBreakdown}
        </ExplainTip>
      </header>

      <nav
        aria-label="Breakdown view"
        className="mt-4 flex flex-wrap gap-1 rounded-xl border border-border-ui bg-page p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-surface text-ink shadow-sm"
                : "text-text-secondary hover:text-ink",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {currentCategories.length === 0 ? (
        <p className="mt-6 text-sm text-text-secondary">
          {isEducator
            ? "No breakdown data yet — this learner has not answered enough questions."
            : "No data yet — complete a quiz to see your breakdown."}
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3" aria-label={`${activeTab} breakdown`}>
          {currentCategories.map((item) => (
            <BreakdownBar key={item.categoryName} item={item} />
          ))}
        </ul>
      )}

      {/* Per-tab focus callout — sits directly under the bars */}
      {needsFocus && weakestCategory !== undefined && (
        <section
          aria-label="Suggested focus area"
          className="mt-5 rounded-xl border border-border-ui bg-page px-4 py-3"
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: masteryColor(weakestCategory.scorePercent) }}
          >
            Suggested focus
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ink">
            {weakestCategory.categoryName}
          </p>
          <p className="mt-0.5 text-sm text-text-secondary">
            {isEducator
              ? `This learner's ${tabFocusLabel[activeTab]} score is ${Math.round(weakestCategory.scorePercent)}%. Encourage more practice here to reach the 70% target.`
              : `Your ${tabFocusLabel[activeTab]} score is ${Math.round(weakestCategory.scorePercent)}%. Practise more here to reach the 70% target.`}
          </p>
        </section>
      )}

      {/* Legend */}
      <footer className="mt-5 flex flex-wrap gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: "#0ca30c" }}
          />
          On track ≥70%
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: "#fab219" }}
          />
          Developing 50–69%
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: "#d03b3b" }}
          />
          Requires focus &lt;50%
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-4"
            style={{ background: "#5A5670" }}
          />
          70% target
        </span>
      </footer>
    </section>
  );
}
