import type { ReactNode } from "react";
import Link from "next/link";

type QuizScoreCardProps = {
  courseId: string;
  correctAnswerCount: number;
  totalQuestionCount: number;
  backToLesson: ReactNode;
};

export function QuizScoreCard({
  courseId,
  correctAnswerCount,
  totalQuestionCount,
  backToLesson,
}: QuizScoreCardProps) {
  return (
    <article className="rounded-2xl border border-border-ui bg-surface p-8 text-center shadow-[0_8px_24px_rgba(30,27,51,0.06)] md:p-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Quiz complete
        </h1>
        <p className="mt-3 text-base text-text-secondary">
          You scored{" "}
          <span className="font-semibold text-ink">
            {correctAnswerCount} / {totalQuestionCount}
          </span>
        </p>
      </header>
      <menu className="mt-8 flex list-none flex-wrap items-center justify-center gap-3 p-0">
        <li>{backToLesson}</li>
        <li>
          <Link
            href={`/student/courses/${courseId}/dashboard`}
            className="inline-flex items-center justify-center rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            Continue to Dashboard
          </Link>
        </li>
      </menu>
    </article>
  );
}
