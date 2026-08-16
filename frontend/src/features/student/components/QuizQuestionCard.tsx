import { QuestionMarkIcon } from "@/components/icons/QuestionMarkIcon";
import type { AttemptItem } from "@/helpers/quizzesApi";
import { CorrectReasonNotice } from "./CorrectReasonNotice";

type QuizQuestionCardProps = {
  item: AttemptItem;
  questionNumber: number;
  totalQuestionCount: number;
  selectedOptionId: string | undefined;
  isSubmitting: boolean;
  onSelectOption: (optionId: string) => void;
  onSubmitAnswer: () => void;
};

export function QuizQuestionCard({
  item,
  questionNumber,
  totalQuestionCount,
  selectedOptionId,
  isSubmitting,
  onSelectOption,
  onSubmitAnswer,
}: QuizQuestionCardProps) {
  const hasAnswered = item.selectedOptionId !== undefined;
  const feedbackRevealed = hasAnswered && item.isCorrect !== undefined;
  const isCorrect = item.isCorrect === true;
  const correctOption = item.options.find((o) => o.isCorrect === true);
  const canSubmit =
    selectedOptionId !== undefined && !hasAnswered && !isSubmitting;

  return (
    <article className="rounded-2xl border border-border-ui bg-surface p-6 shadow-[0_8px_24px_rgba(30,27,51,0.06)] md:p-8">
      <p className="text-sm font-medium text-text-secondary">
        Question {questionNumber} of {totalQuestionCount}
      </p>
      <progress
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full accent-ink [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-border-ui [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-ink [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-ink"
        max={totalQuestionCount}
        value={questionNumber}
      >
        {questionNumber} of {totalQuestionCount}
      </progress>

      <header className="mt-6 flex flex-wrap items-start gap-3">
        <figure className="m-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-white">
          <QuestionMarkIcon className="h-5 w-5" />
        </figure>
        {(item.sectionTitle !== undefined ||
          item.bloomLevel !== undefined ||
          item.difficultyLevel !== undefined) && (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0 pt-1">
            {item.sectionTitle !== undefined && (
              <li className="rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold text-ink">
                {item.sectionTitle}
              </li>
            )}
            {item.bloomLevel !== undefined && (
              <li className="rounded-full bg-coral/15 px-3 py-1 text-xs font-semibold text-coral">
                {item.bloomLevel}
              </li>
            )}
            {item.difficultyLevel !== undefined && (
              <li className="rounded-full bg-border-ui px-3 py-1 text-xs font-semibold text-text-secondary">
                {item.difficultyLevel}
              </li>
            )}
          </ul>
        )}
      </header>

      <h2 className="mt-5 text-xl font-bold tracking-tight text-ink md:text-2xl">
        {item.prompt}
      </h2>

      <fieldset className="mt-6 border-0 p-0">
        <legend className="sr-only">Answer choices</legend>
        <ul className="flex list-none flex-col gap-3 p-0">
          {item.options.map((option) => {
            const wasSelected =
              (hasAnswered ? item.selectedOptionId : selectedOptionId) ===
              option.id;
            const isTheCorrect = feedbackRevealed && option.isCorrect === true;
            const isWrongSelected =
              feedbackRevealed && wasSelected && !isTheCorrect;
            const isLocked = hasAnswered || isSubmitting;

            let borderClass = "border-border-ui bg-surface";
            if (isTheCorrect && feedbackRevealed) {
              borderClass = "border-emerald-400 bg-emerald-50";
            } else if (isWrongSelected) {
              borderClass = "border-coral/60 bg-coral/10";
            } else if (!hasAnswered && wasSelected) {
              borderClass = "border-ink bg-ink/5";
            }

            return (
              <li key={option.id}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${borderClass} ${isLocked ? "cursor-default" : "hover:bg-page"}`}
                >
                  <input
                    type="radio"
                    name={`question-${item.id}`}
                    value={option.id}
                    checked={wasSelected}
                    disabled={isLocked}
                    onChange={() => onSelectOption(option.id)}
                    className="mt-1 h-4 w-4 accent-ink"
                  />
                  <span
                    className={`text-sm leading-relaxed md:text-base ${
                      isTheCorrect && feedbackRevealed
                        ? "font-semibold text-emerald-900"
                        : isWrongSelected
                          ? "text-ink"
                          : "text-ink"
                    }`}
                  >
                    {option.optionText}
                  </span>
                  {isTheCorrect && feedbackRevealed && (
                    <span className="ml-auto shrink-0 text-emerald-700">✓</span>
                  )}
                  {isWrongSelected && (
                    <span className="ml-auto shrink-0 text-coral">✗</span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {feedbackRevealed ? (
        <section
          aria-live="polite"
          className={
            isCorrect
              ? "mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900"
              : "mt-6 rounded-xl border border-coral/40 bg-coral/10 p-4 text-ink"
          }
        >
          <p className="flex items-center gap-2 text-sm font-bold">
            <span
              aria-hidden="true"
              className={
                isCorrect
                  ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white"
                  : "inline-flex h-6 w-6 items-center justify-center rounded-full bg-coral text-xs text-white"
              }
            >
              {isCorrect ? "✓" : "✗"}
            </span>
            {isCorrect ? "Correct!" : "Incorrect"}
          </p>
          {!isCorrect && correctOption !== undefined && (
            <p className="mt-2 text-sm">
              The correct answer was:{" "}
              <span className="font-semibold">{correctOption.optionText}</span>
            </p>
          )}
          <CorrectReasonNotice reason={item.correctReason} />
        </section>
      ) : hasAnswered ? (
        <p className="mt-6 text-sm font-medium text-text-secondary">
          Saving…
        </p>
      ) : (
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmitAnswer}
          className="mt-6 w-full rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Submit Answer"}
        </button>
      )}
    </article>
  );
}
