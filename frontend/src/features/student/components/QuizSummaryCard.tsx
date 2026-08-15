import type { AttemptItem } from "@/helpers/quizzesApi";

type BreakdownRow = {
  label: string;
  correct: number;
  total: number;
};

function buildBreakdown(
  items: AttemptItem[],
  keyFn: (item: AttemptItem) => string[],
): BreakdownRow[] {
  const map = new Map<string, { correct: number; total: number }>();
  for (const item of items) {
    const keys = keyFn(item);
    for (const key of keys) {
      const existing = map.get(key) ?? { correct: 0, total: 0 };
      map.set(key, {
        correct: existing.correct + (item.isCorrect === true ? 1 : 0),
        total: existing.total + 1,
      });
    }
  }
  return Array.from(map.entries())
    .map(([label, stats]) => ({ label, ...stats }))
    .sort((a, b) => b.total - a.total);
}

type BarRowProps = {
  label: string;
  correct: number;
  total: number;
};

function BarRow({ label, correct, total }: BarRowProps) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isGood = pct >= 70;
  const isMid = pct >= 40 && pct < 70;

  const fillClass = isGood
    ? "bg-emerald-500"
    : isMid
      ? "bg-amber-400"
      : "bg-coral";

  return (
    <li className="grid items-center gap-x-3 gap-y-1 [grid-template-columns:1fr_auto_3rem]">
      <span className="truncate text-sm font-medium text-ink">{label}</span>
      <span className="text-right text-xs tabular-nums text-text-secondary">
        {correct}/{total}
      </span>
      <span className="text-right text-xs font-semibold tabular-nums text-text-secondary">
        {pct}%
      </span>
      <div className="col-span-3 h-2 overflow-hidden rounded-full bg-border-ui">
        <div
          className={`h-full rounded-full transition-all ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

type QuizSummaryCardProps = {
  items: AttemptItem[];
};

const BLOOM_ORDER = [
  "Remember",
  "Understand",
  "Apply",
  "Analyze",
  "Evaluate",
  "Create",
];
const DIFFICULTY_ORDER = ["Easy", "Medium", "Hard", "Expert"];

export function QuizSummaryCard({ items }: QuizSummaryCardProps) {
  const sectionRows = buildBreakdown(items, (i) =>
    i.sectionTitle !== undefined ? [i.sectionTitle] : [],
  );

  const difficultyRows = buildBreakdown(items, (i) =>
    i.difficultyLevel !== undefined ? [i.difficultyLevel] : [],
  ).sort(
    (a, b) =>
      (DIFFICULTY_ORDER.indexOf(a.label) ?? 99) -
      (DIFFICULTY_ORDER.indexOf(b.label) ?? 99),
  );

  const bloomRows = buildBreakdown(items, (i) =>
    i.bloomLevel !== undefined ? [i.bloomLevel] : [],
  ).sort(
    (a, b) =>
      (BLOOM_ORDER.indexOf(a.label) ?? 99) -
      (BLOOM_ORDER.indexOf(b.label) ?? 99),
  );

  return (
    <article className="rounded-2xl border border-border-ui bg-surface p-6 shadow-[0_8px_24px_rgba(30,27,51,0.06)] md:p-8">
      <h2 className="text-lg font-bold tracking-tight text-ink">
        Performance breakdown
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Green ≥ 70 % · Amber 40–69 % · Red &lt; 40 %
      </p>

      {sectionRows.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            By section
          </h3>
          <ul className="flex list-none flex-col gap-4 p-0">
            {sectionRows.map((row) => (
              <BarRow key={row.label} {...row} />
            ))}
          </ul>
        </section>
      )}

      {difficultyRows.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            By difficulty
          </h3>
          <ul className="flex list-none flex-col gap-4 p-0">
            {difficultyRows.map((row) => (
              <BarRow key={row.label} {...row} />
            ))}
          </ul>
        </section>
      )}

      {bloomRows.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            By cognitive level (Bloom)
          </h3>
          <ul className="flex list-none flex-col gap-4 p-0">
            {bloomRows.map((row) => (
              <BarRow key={row.label} {...row} />
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
