"use client";

import { useState } from "react";
import Link from "next/link";
import { BookIcon } from "@/components/icons/BookIcon";
import { ClockBoltIcon } from "@/components/icons/ClockBoltIcon";
import { MessageCircleIcon } from "@/components/icons/MessageCircleIcon";
import type {
  StudentRecommendation,
  RecommendationCategory,
  RecommendationCta,
} from "@/helpers/studentDashboardApi";

const PER_CATEGORY_CAP = 3;

type CategoryConfig = {
  label: string;
  icon: React.ReactNode;
  borderColor: string;
  iconBg: string;
  iconColor: string;
};

const categoryConfig: Record<RecommendationCategory, CategoryConfig> = {
  needs_reinforcement: {
    label: "Needs reinforcement",
    icon: <BookIcon className="h-4 w-4" />,
    borderColor: "#bfdbfe",
    iconBg: "#eff6ff",
    iconColor: "#2563eb",
  },
  take_your_time: {
    label: "Take your time",
    icon: <ClockBoltIcon className="h-4 w-4" />,
    borderColor: "#fed7aa",
    iconBg: "#fff7ed",
    iconColor: "#ea580c",
  },
  talk_to_educator: {
    label: "Talk to your educator",
    icon: <MessageCircleIcon className="h-4 w-4" />,
    borderColor: "#bbf7b0",
    iconBg: "#f0fdf0",
    iconColor: "#16a34a",
  },
};

const CATEGORY_ORDER: RecommendationCategory[] = [
  "needs_reinforcement",
  "take_your_time",
  "talk_to_educator",
];

function ctaHref(
  cta: RecommendationCta,
  courseId: string,
  sectionId: string | undefined,
): string | undefined {
  if (cta === "quiz") return `/student/courses/${courseId}/quiz`;
  if (cta === "content" && sectionId !== undefined) {
    return `/student/courses/${courseId}#lesson-unit-${sectionId}`;
  }
  return undefined;
}

function ctaLabel(cta: RecommendationCta): string {
  if (cta === "quiz") return "Take quiz";
  if (cta === "content") return "Review content";
  return "";
}

function RecommendationItem({
  rec,
  courseId,
  showLinks,
}: {
  rec: StudentRecommendation;
  courseId: string;
  showLinks: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const href = ctaHref(rec.cta, courseId, rec.sectionId);

  return (
    <li className="flex flex-col gap-2 border-t border-border-ui py-3 first:border-t-0 first:pt-0">
      <p className="text-sm leading-relaxed text-ink">{rec.sentence}</p>

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-fit items-center gap-1 text-xs text-text-secondary hover:text-ink"
        aria-expanded={expanded}
      >
        <span>Why am I seeing this?</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={[
            "h-3.5 w-3.5 transition-transform duration-200",
            expanded ? "rotate-180" : "",
          ].join(" ")}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <p className="text-xs leading-relaxed text-text-secondary">
          {rec.evidence}
        </p>
      )}

      {showLinks && href !== undefined && (
        <Link
          href={href}
          className="mt-0.5 w-fit text-xs font-semibold text-coral hover:underline"
        >
          {ctaLabel(rec.cta)} →
        </Link>
      )}
    </li>
  );
}

type CategoryGroup = {
  category: RecommendationCategory;
  items: StudentRecommendation[];
};

function groupByCategory(
  recommendations: StudentRecommendation[],
): CategoryGroup[] {
  const groups = new Map<RecommendationCategory, StudentRecommendation[]>();
  for (const rec of recommendations) {
    const existing = groups.get(rec.category);
    if (existing !== undefined) {
      existing.push(rec);
    } else {
      groups.set(rec.category, [rec]);
    }
  }
  return CATEGORY_ORDER.flatMap((cat) => {
    const items = groups.get(cat);
    return items !== undefined ? [{ category: cat, items }] : [];
  });
}

type RecommendationCardsProps = {
  recommendations: StudentRecommendation[];
  courseId: string;
  showLinks?: boolean;
};

export function RecommendationCards({
  recommendations,
  courseId,
  showLinks = true,
}: RecommendationCardsProps) {
  if (recommendations.length === 0) return null;

  const groups = groupByCategory(recommendations);

  return (
    <section aria-labelledby="recommendations-heading">
      <h2
        id="recommendations-heading"
        className="text-xl font-bold tracking-tight text-ink"
      >
        Recommendations
      </h2>

      <ul className="mt-4 flex flex-col gap-4">
        {groups.map((group) => {
          const cfg = categoryConfig[group.category];
          const visible = group.items.slice(0, PER_CATEGORY_CAP);
          const overflow = group.items.length - PER_CATEGORY_CAP;

          return (
            <li
              key={group.category}
              className="rounded-2xl border bg-surface p-5"
              style={{ borderColor: cfg.borderColor }}
            >
              {/* Category header */}
              <header className="flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: cfg.iconBg,
                    color: cfg.iconColor,
                  }}
                >
                  {cfg.icon}
                </span>
                <span className="text-sm font-semibold text-ink">
                  {cfg.label}
                </span>
                <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-medium text-ink"
                  style={{ background: "#E4E2EC" }}>
                  {group.items.length}
                </span>
              </header>

              {/* Items */}
              <ul className="mt-3">
                {visible.map((rec) => (
                  <RecommendationItem
                    key={rec.id}
                    rec={rec}
                    courseId={courseId}
                    showLinks={showLinks}
                  />
                ))}
              </ul>

              {overflow > 0 && (
                <p className="mt-2 text-xs text-text-secondary">
                  +{overflow} more in this category
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
