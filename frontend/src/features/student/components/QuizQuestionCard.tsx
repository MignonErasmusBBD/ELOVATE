import { QuestionMarkIcon } from "@/components/icons/QuestionMarkIcon";
import type {
  PracticeQuizQuestion,
  QuizOptionId,
} from "../types";

type QuizQuestionCardProps = {
  question: PracticeQuizQuestion;
  questionNumber: number;
  totalQuestionCount: number;
  selectedOptionId: QuizOptionId | undefined;
  submittedOptionId: QuizOptionId | undefined;
  onSelectOption: (optionId: QuizOptionId) => void;
  onSubmitAnswer: () => void;
};

export function QuizQuestionCard({
  question,
  questionNumber,
  totalQuestionCount,
  selectedOptionId,
  submittedOptionId,
  onSelectOption,
  onSubmitAnswer,
}: QuizQuestionCardProps) {
  const hasSubmitted = submittedOptionId !== undefined;
  const isCorrect =
    hasSubmitted && submittedOptionId === question.correctOptionId;
  const canSubmit =
    selectedOptionId !== undefined && submittedOptionId === undefined;

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

      <header className="mt-6 flex flex-wrap items-center gap-3">
        <figure className="m-0 flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
          <QuestionMarkIcon className="h-5 w-5" />
        </figure>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          <li className="rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold text-ink">
            {question.topic}
          </li>
          <li className="rounded-full bg-coral/15 px-3 py-1 text-xs font-semibold text-coral">
            {question.bloomLevel}
          </li>
          <li className="rounded-full bg-border-ui px-3 py-1 text-xs font-semibold text-text-secondary">
            {question.difficulty}
          </li>
        </ul>
      </header>

      <h2 className="mt-5 text-xl font-bold tracking-tight text-ink md:text-2xl">
        {question.prompt}
      </h2>

      <fieldset className="mt-6 border-0 p-0">
        <legend className="sr-only">Answer choices</legend>
        <ul className="flex list-none flex-col gap-3 p-0">
          {question.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const optionClasses = isSelected
              ? "border-ink bg-ink/5"
              : "border-border-ui bg-surface hover:bg-page";

            return (
              <li key={option.id}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 ${optionClasses} ${hasSubmitted ? "cursor-default" : ""}`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.id}
                    checked={isSelected}
                    disabled={hasSubmitted}
                    onChange={() => onSelectOption(option.id)}
                    className="mt-1 h-4 w-4 accent-ink"
                  />
                  <span className="text-sm leading-relaxed text-ink md:text-base">
                    <span className="font-semibold">{option.id})</span>{" "}
                    {option.label}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {hasSubmitted ? (
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
              {isCorrect ? "✓" : "✕"}
            </span>
            {isCorrect ? "Correct!" : "Incorrect"}
          </p>
          <p className="mt-2 text-sm">
            Your answer: {submittedOptionId}
            {isCorrect === false ? (
              <span> · Correct answer: {question.correctOptionId}</span>
            ) : undefined}
          </p>
          <p className="mt-3 text-sm leading-relaxed">
            <span className="font-semibold">Explanation:</span>{" "}
            {question.explanation}
          </p>
        </section>
      ) : (
        <button
          type="button"
          disabled={canSubmit === false}
          onClick={onSubmitAnswer}
          className="mt-6 w-full rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit Answer
        </button>
      )}
    </article>
  );
}
