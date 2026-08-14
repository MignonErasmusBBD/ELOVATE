type QuizStartCardProps = {
  courseTitle: string;
  onStartQuiz: () => void;
};

export function QuizStartCard({
  courseTitle,
  onStartQuiz,
}: QuizStartCardProps) {
  return (
    <article className="rounded-2xl border border-border-ui bg-surface p-8 text-center shadow-[0_8px_24px_rgba(30,27,51,0.06)] md:p-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Practice Quiz
        </h1>
        <p className="mt-3 text-base text-text-secondary">
          This practice quiz is tied to{" "}
          <span className="font-semibold text-ink">{courseTitle}</span>. Answer
          one question at a time and get feedback immediately.
        </p>
      </header>
      <button
        type="button"
        onClick={onStartQuiz}
        className="mt-8 w-full rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white hover:brightness-110"
      >
        Start Quiz
      </button>
    </article>
  );
}
