import type { AttemptItem } from "@/helpers/quizzesApi";
import { CorrectReasonNotice } from "./CorrectReasonNotice";

type QuizReviewCardProps = {
  item: AttemptItem;
  questionNumber: number;
};

export function QuizReviewCard({ item, questionNumber }: QuizReviewCardProps) {
  const isCorrect = item.isCorrect === true;
  const correctOption = item.options.find((o) => o.isCorrect === true);

  return (
    <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_4px_12px_rgba(30,27,51,0.04)]">
      <header className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Question {questionNumber}
        </p>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            isCorrect
              ? "bg-emerald-100 text-emerald-800"
              : "bg-coral/15 text-coral"
          }`}
        >
          {isCorrect ? "Correct ✓" : "Incorrect ✗"}
        </span>
      </header>

      <h3 className="mt-3 text-base font-semibold leading-snug text-ink">
        {item.prompt}
      </h3>

      <ul className="mt-4 flex list-none flex-col gap-2 p-0">
        {item.options.map((option) => {
          const wasSelected = item.selectedOptionId === option.id;
          const isTheCorrect = option.isCorrect === true;

          let borderClass = "border-border-ui bg-surface text-text-secondary";
          if (wasSelected && isTheCorrect) {
            borderClass = "border-emerald-400 bg-emerald-50 text-emerald-900";
          } else if (wasSelected && !isTheCorrect) {
            borderClass = "border-coral/60 bg-coral/10 text-ink";
          } else if (!wasSelected && isTheCorrect) {
            borderClass = "border-emerald-300 bg-emerald-50/60 text-emerald-900";
          }

          return (
            <li
              key={option.id}
              className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${borderClass}`}
            >
              <span className="shrink-0 font-semibold">
                {wasSelected ? (isTheCorrect ? "✓" : "✗") : isTheCorrect ? "→" : ""}
              </span>
              <span className="leading-relaxed">{option.optionText}</span>
            </li>
          );
        })}
      </ul>

      {!isCorrect && correctOption !== undefined && (
        <p className="mt-4 rounded-xl bg-ink/5 px-4 py-3 text-sm text-ink">
          <span className="font-semibold">Correct answer:</span>{" "}
          {correctOption.optionText}
        </p>
      )}
      {item.correctReason === undefined ? undefined : (
        <section className="mt-4 rounded-xl bg-ink/5 px-4 py-3">
          <CorrectReasonNotice reason={item.correctReason} className="mt-0" />
        </section>
      )}
    </article>
  );
}
