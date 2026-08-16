import type { ReactNode } from "react";
import Link from "next/link";

type QuizScoreCardProps = {
  courseId: string;
  correctAnswerCount: number;
  totalQuestionCount: number;
  ratingDelta: number | undefined;
  durationSeconds: number | undefined;
  backToLesson: ReactNode;
  onRedo: () => void;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function QuizScoreCard({
  courseId,
  correctAnswerCount,
  totalQuestionCount,
  ratingDelta,
  durationSeconds,
  backToLesson,
  onRedo,
}: QuizScoreCardProps) {
  const scorePercent =
    totalQuestionCount > 0
      ? Math.round((correctAnswerCount / totalQuestionCount) * 100)
      : 0;

  const ratingLabel =
    ratingDelta === undefined
      ? undefined
      : ratingDelta > 0
        ? `+${ratingDelta} rating`
        : ratingDelta < 0
          ? `${ratingDelta} rating`
          : undefined;

  return (
    <article className="rounded-2xl border border-border-ui bg-surface p-8 text-center shadow-[0_8px_24px_rgba(30,27,51,0.06)] md:p-10">
      <header>
        <p className="text-6xl font-bold tabular-nums tracking-tight text-ink">
          {scorePercent}%
        </p>
        <p className="mt-3 text-base text-text-secondary">
          You answered{" "}
          <span className="font-semibold text-ink">
            {correctAnswerCount} of {totalQuestionCount}
          </span>{" "}
          questions correctly.
        </p>
        {ratingLabel !== undefined && (
          <p
            className={`mt-2 text-sm font-semibold ${ratingDelta !== undefined && ratingDelta > 0 ? "text-emerald-700" : "text-coral"}`}
          >
            {ratingLabel}
          </p>
        )}
        {durationSeconds !== undefined && (
          <p className="mt-2 text-sm text-text-secondary">
            Completed in{" "}
            <span className="font-semibold text-ink">
              {formatDuration(durationSeconds)}
            </span>
          </p>
        )}
      </header>

      <menu className="mt-8 flex list-none flex-wrap items-center justify-center gap-3 p-0">
        <li>{backToLesson}</li>
        <li>
          <button
            type="button"
            onClick={onRedo}
            className="inline-flex items-center justify-center rounded-lg border border-border-ui bg-surface px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-page"
          >
            Try Another Quiz
          </button>
        </li>
        <li>
          <Link
            href={`/student/courses/${courseId}/dashboard`}
            className="inline-flex items-center justify-center rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            Go to Dashboard
          </Link>
        </li>
      </menu>
    </article>
  );
}
