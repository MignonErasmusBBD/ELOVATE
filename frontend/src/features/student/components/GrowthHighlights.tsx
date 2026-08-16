import { InfoTooltip } from "./InfoTooltip";

type Highlight = {
  type: "progress" | "consistency" | "momentum" | "honesty";
  title: string;
  description: string;
};

type GrowthHighlightsProps = {
  totalAttempts: number;
  growthDeltaPercent: number | undefined;
  streakAboveTarget: number;
  mostImprovedCategory: string | undefined;
  regressionFlag: boolean;
  stalledFlag: boolean;
  bestScorePercent: number | undefined;
  firstAttemptScorePercent: number | undefined;
  avgScorePercent: number | undefined;
};

const typeConfig: Record<
  Highlight["type"],
  { label: string; bg: string; labelColor: string; titleColor: string; border: string }
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

function buildHighlights(props: GrowthHighlightsProps): Highlight[] {
  const {
    totalAttempts,
    growthDeltaPercent,
    streakAboveTarget,
    mostImprovedCategory,
    regressionFlag,
    stalledFlag,
    bestScorePercent,
    firstAttemptScorePercent,
    avgScorePercent,
  } = props;

  const list: Highlight[] = [];

  // --- Honesty (always first when genuinely applicable) ---
  if (regressionFlag) {
    list.push({
      type: "honesty",
      title: "Recent scores have dipped",
      description:
        "Your last few quizzes are below your earlier average. Check your weakest breakdown area and focus your next session there.",
    });
  } else if (stalledFlag) {
    list.push({
      type: "honesty",
      title: "Scores have plateaued",
      description:
        "Your last 5 attempts are close together and still below 70%. A focused session on a specific category can break the pattern.",
    });
  }

  // --- Progress ---
  if (growthDeltaPercent !== undefined && growthDeltaPercent > 2 && totalAttempts >= 4) {
    const delta = Math.round(growthDeltaPercent);
    list.push({
      type: "progress",
      title: `+${delta} percentage point${delta === 1 ? "" : "s"}`,
      description:
        "Your recent scores are ahead of where you started — you're trending in the right direction.",
    });
  } else if (
    firstAttemptScorePercent !== undefined &&
    avgScorePercent !== undefined &&
    avgScorePercent > firstAttemptScorePercent + 5
  ) {
    const delta = Math.round(avgScorePercent - firstAttemptScorePercent);
    list.push({
      type: "progress",
      title: `+${delta} points since attempt 1`,
      description:
        "Your overall average has climbed above your starting score — steady, consistent improvement.",
    });
  }

  if (mostImprovedCategory !== undefined) {
    list.push({
      type: "progress",
      title: `${mostImprovedCategory} is your biggest gain`,
      description:
        "This area has improved the most from your first attempts to your recent ones. Keep building on it.",
    });
  }

  // --- Consistency ---
  if (streakAboveTarget >= 3) {
    list.push({
      type: "consistency",
      title: `${streakAboveTarget} quizzes above 70% in a row`,
      description:
        "You're consistently hitting the target. Keep the habit going and protect this streak.",
    });
  } else if (avgScorePercent !== undefined && avgScorePercent >= 70) {
    list.push({
      type: "consistency",
      title: `${Math.round(avgScorePercent)}% overall average`,
      description:
        "You're sitting above the 70% target across all your practice — solid, sustained performance.",
    });
  }

  // --- Momentum ---
  if (bestScorePercent !== undefined && bestScorePercent >= 70) {
    list.push({
      type: "momentum",
      title: `${Math.round(bestScorePercent)}% personal best`,
      description:
        "That's your highest single quiz score. Aim to make it your new floor, not your ceiling.",
    });
  }

  // --- Honesty fallback (always include at least one honest callout) ---
  if (list.every((h) => h.type !== "honesty")) {
    if (totalAttempts < 5) {
      list.push({
        type: "honesty",
        title: "Still early days",
        description:
          "With only a few attempts, trends aren't reliable yet. Keep practising to get a clearer picture.",
      });
    } else {
      list.push({
        type: "honesty",
        title: "Scores naturally vary",
        description:
          "Quiz-to-quiz variation is normal — watch your trend line over time rather than any single result.",
      });
    }
  }

  return list.slice(0, 4);
}

export function GrowthHighlights(props: GrowthHighlightsProps) {
  if (props.totalAttempts === 0) {
    return null;
  }

  const highlights = buildHighlights(props);

  return (
    <section aria-labelledby="growth-heading">
      <header className="flex items-center gap-2">
        <h2
          id="growth-heading"
          className="text-xl font-bold tracking-tight text-ink"
        >
          Growth highlights
        </h2>
        <InfoTooltip
          label="What growth highlights shows"
          text="Callouts about your practice trends — progress since your first attempts, streaks above the 70% target, and honest flags when scores have dipped or stalled."
        />
      </header>

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {highlights.map((h, i) => {
          const cfg = typeConfig[h.type];
          return (
            <li
              key={i}
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
                {h.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                {h.description}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
