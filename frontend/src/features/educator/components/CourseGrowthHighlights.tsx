import { ExplainTip } from "@/components/ui/ExplainTip";
import { explainCopy } from "@/helpers/explainCopy";
import type { CourseGrowthHighlight } from "@/helpers/educatorPracticeInsightsApi";

type CourseGrowthHighlightsProps = {
  highlights: CourseGrowthHighlight[];
};

const typeConfig: Record<
  CourseGrowthHighlight["type"],
  {
    label: string;
    bg: string;
    labelColor: string;
    titleColor: string;
    border: string;
  }
> = {
  progress: {
    label: "Progress",
    bg: "#f0fdf0",
    labelColor: "#0ca30c",
    titleColor: "#14532d",
    border: "#bbf7b0",
  },
  consistency: {
    label: "Consistency",
    bg: "#eff6ff",
    labelColor: "#2563eb",
    titleColor: "#1e3a8a",
    border: "#bfdbfe",
  },
  momentum: {
    label: "Momentum",
    bg: "#fff7ed",
    labelColor: "#ea580c",
    titleColor: "#7c2d12",
    border: "#fed7aa",
  },
  honesty: {
    label: "Watch out",
    bg: "#fff1f2",
    labelColor: "#d03b3b",
    titleColor: "#7f1d1d",
    border: "#fecdd3",
  },
};

export function CourseGrowthHighlights({
  highlights,
}: CourseGrowthHighlightsProps) {
  if (highlights.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="course-growth-heading" className="mt-4">
      <header className="flex items-center gap-2">
        <h3
          id="course-growth-heading"
          className="text-base font-bold text-ink"
        >
          Growth highlights
        </h3>
        <ExplainTip label="About course growth highlights">
          {explainCopy.practiceGrowthHighlights}
        </ExplainTip>
      </header>

      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {highlights.map((highlight) => {
          const cfg = typeConfig[highlight.type];
          return (
            <li
              key={`${highlight.type}-${highlight.title}`}
              className="rounded-xl border p-4"
              style={{ background: cfg.bg, borderColor: cfg.border }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: cfg.labelColor }}
              >
                {cfg.label}
              </p>
              <p
                className="mt-1.5 text-base font-bold leading-snug"
                style={{ color: cfg.titleColor }}
              >
                {highlight.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                {highlight.description}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
