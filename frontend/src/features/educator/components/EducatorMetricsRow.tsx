type EducatorMetricsRowProps = {
  totalStudents: number;
  averagePracticeQuizPercent: number;
  totalQuestions: number;
};

export function EducatorMetricsRow({
  totalStudents,
  averagePracticeQuizPercent,
  totalQuestions,
}: EducatorMetricsRowProps) {
  return (
    <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      <li>
        <article className="rounded-2xl border border-border-ui border-l-4 border-l-ink bg-surface px-5 py-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
          <p className="text-3xl font-bold tracking-tight text-ink">
            {totalStudents}
          </p>
          <h2 className="mt-1 text-sm font-medium text-text-secondary">
            Total Students
          </h2>
        </article>
      </li>
      <li>
        <article className="rounded-2xl border border-border-ui border-l-4 border-l-coral bg-surface px-5 py-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
          <p className="text-3xl font-bold tracking-tight text-coral">
            {averagePracticeQuizPercent}%
          </p>
          <h2 className="mt-1 text-sm font-medium text-text-secondary">
            AVG Practice Quiz
          </h2>
        </article>
      </li>
      <li>
        <article className="rounded-2xl border border-border-ui border-l-4 border-l-sky-600 bg-surface px-5 py-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
          <p className="text-3xl font-bold tracking-tight text-sky-700">
            {totalQuestions}
          </p>
          <h2 className="mt-1 text-sm font-medium text-text-secondary">
            Questions Added
          </h2>
        </article>
      </li>
    </ul>
  );
}
