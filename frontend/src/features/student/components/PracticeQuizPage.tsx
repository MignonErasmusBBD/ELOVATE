"use client";

import { useCallback, useEffect, useState } from "react";
import { getCourse } from "@/helpers/coursesApi";
import {
  completeQuiz,
  generateQuiz,
  startQuiz,
  submitAnswer,
  type AttemptItem,
  type QuizAttempt,
} from "@/helpers/quizzesApi";
import { Spinner } from "@/components/ui/Spinner";
import { errorMessageFromUnknown } from "@/helpers/elovateApi";
import { NARROW_PAGE_SHELL_CLASS } from "@/helpers/pageLayout";
import type { QuizPhase } from "../types";
import { BackToLessonLink } from "./BackToLessonLink";
import { useQuizProgress } from "./QuizProgressContext";
import { QuizQuestionCard } from "./QuizQuestionCard";
import { QuizReviewCard } from "./QuizReviewCard";
import { QuizScoreCard } from "./QuizScoreCard";
import { QuizStartCard } from "./QuizStartCard";
import { QuizSummaryCard } from "./QuizSummaryCard";

type PracticeQuizPageProps = {
  courseId: string;
};

export function PracticeQuizPage({ courseId }: PracticeQuizPageProps) {
  const { setQuizInProgress } = useQuizProgress();
  const [courseTitle, setCourseTitle] = useState<string | undefined>();
  const [phase, setPhase] = useState<QuizPhase>("start");
  const [attempt, setAttempt] = useState<QuizAttempt | undefined>();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [localSelection, setLocalSelection] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    const active =
      phase === "question" ||
      phase === "submitting" ||
      phase === "completing" ||
      phase === "loading";
    setQuizInProgress(active);
  }, [phase, setQuizInProgress]);

  useEffect(() => {
    let cancelled = false;
    getCourse(courseId)
      .then((c) => {
        if (!cancelled) setCourseTitle(c?.title);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const handleStartQuiz = useCallback(async () => {
    setPhase("loading");
    setErrorMessage(undefined);
    try {
      const generated = await generateQuiz(courseId);
      const started = await startQuiz(generated.id);
      setAttempt(started);
      setCurrentItemIndex(0);
      setLocalSelection(undefined);
      setPhase("question");
    } catch (err) {
      setErrorMessage(errorMessageFromUnknown(err, "Failed to start quiz. Please try again."));
      setPhase("error");
    }
  }, [courseId]);

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (attempt === undefined) return;
      const item = attempt.items[currentItemIndex];
      if (item === undefined || item.selectedOptionId !== undefined) return;
      setLocalSelection(optionId);
    },
    [attempt, currentItemIndex],
  );

  const handleSubmitAnswer = useCallback(async () => {
    if (attempt === undefined || localSelection === undefined) return;
    const item = attempt.items[currentItemIndex];
    if (item === undefined || item.selectedOptionId !== undefined) return;

    setPhase("submitting");
    try {
      const updated = await submitAnswer(attempt.id, item.id, localSelection);
      setAttempt(updated);
      setLocalSelection(undefined);
      setPhase("question");
    } catch (err) {
      setErrorMessage(errorMessageFromUnknown(err, "Failed to submit answer. Please try again."));
      setPhase("error");
    }
  }, [attempt, currentItemIndex, localSelection]);

  const handleGoToNext = useCallback(async () => {
    if (attempt === undefined) return;
    const isLast = currentItemIndex >= attempt.items.length - 1;

    if (isLast) {
      setPhase("completing");
      try {
        const completed = await completeQuiz(attempt.id);
        setAttempt(completed);
        setPhase("results");
      } catch (err) {
        setErrorMessage(errorMessageFromUnknown(err, "Failed to complete quiz. Please try again."));
        setPhase("error");
      }
      return;
    }

    setCurrentItemIndex((prev) => prev + 1);
    setLocalSelection(undefined);
  }, [attempt, currentItemIndex]);

  const handleGoToPrev = useCallback(() => {
    if (currentItemIndex === 0) return;
    setCurrentItemIndex((prev) => prev - 1);
    setLocalSelection(undefined);
  }, [currentItemIndex]);

  const handleRedo = useCallback(() => {
    setAttempt(undefined);
    setCurrentItemIndex(0);
    setLocalSelection(undefined);
    setErrorMessage(undefined);
    setPhase("start");
  }, []);

  if (phase === "loading" || phase === "completing") {
    return (
      <section className={NARROW_PAGE_SHELL_CLASS}>
        <div className="flex min-h-48 items-center justify-center rounded-2xl border border-border-ui bg-surface p-8 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
          <p className="inline-flex items-center gap-2 text-base font-medium text-text-secondary">
            <Spinner className="size-5" />
            {phase === "loading" ? "Generating your quiz…" : "Marking your quiz…"}
          </p>
        </div>
      </section>
    );
  }

  if (phase === "error") {
    return (
      <section className={NARROW_PAGE_SHELL_CLASS}>
        <div className="rounded-2xl border border-coral/40 bg-coral/10 p-8">
          <p className="font-semibold text-ink">Something went wrong</p>
          <p className="mt-2 text-sm text-text-secondary">
            {errorMessage ?? "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={handleRedo}
            className="mt-6 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (phase === "start") {
    return (
      <section className={NARROW_PAGE_SHELL_CLASS}>
        <QuizStartCard
          courseTitle={courseTitle ?? "this course"}
          onStartQuiz={handleStartQuiz}
        />
      </section>
    );
  }

  if (phase === "results" && attempt !== undefined) {
    const correctCount = attempt.items.filter((i) => i.isCorrect === true).length;
    const total = attempt.items.length;
    const ratingDelta =
      attempt.ratingAtCompletion !== undefined
        ? attempt.ratingAtCompletion - attempt.ratingAtGeneration
        : undefined;
    const durationSeconds =
      attempt.startedAt !== undefined && attempt.completedAt !== undefined
        ? Math.round(
            (new Date(attempt.completedAt).getTime() -
              new Date(attempt.startedAt).getTime()) /
              1000,
          )
        : undefined;

    return (
      <section className={NARROW_PAGE_SHELL_CLASS}>
        <QuizScoreCard
          courseId={courseId}
          correctAnswerCount={correctCount}
          totalQuestionCount={total}
          ratingDelta={ratingDelta}
          durationSeconds={durationSeconds}
          backToLesson={<BackToLessonLink courseId={courseId} />}
          onRedo={handleRedo}
        />

        <QuizSummaryCard items={attempt.items} />

        <section aria-label="Question review" className="mt-8 space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Review your answers
          </h2>
          {attempt.items.map((item, idx) => (
            <QuizReviewCard key={item.id} item={item} questionNumber={idx + 1} />
          ))}
        </section>
      </section>
    );
  }

  if (
    (phase === "question" || phase === "submitting") &&
    attempt !== undefined
  ) {
    const currentItem: AttemptItem | undefined = attempt.items[currentItemIndex];
    if (currentItem === undefined) return null;

    const isSubmitting = phase === "submitting";
    const hasAnswered = currentItem.selectedOptionId !== undefined;
    const isLast = currentItemIndex >= attempt.items.length - 1;

    const effectiveSelection = hasAnswered
      ? currentItem.selectedOptionId
      : localSelection;

    return (
      <section className={NARROW_PAGE_SHELL_CLASS}>
        <QuizQuestionCard
          item={currentItem}
          questionNumber={currentItemIndex + 1}
          totalQuestionCount={attempt.items.length}
          selectedOptionId={effectiveSelection}
          isSubmitting={isSubmitting}
          onSelectOption={handleSelectOption}
          onSubmitAnswer={handleSubmitAnswer}
        />
        <nav
          aria-label="Question navigation"
          className="mt-6 flex flex-wrap items-center justify-between gap-3"
        >
          <button
            type="button"
            disabled={currentItemIndex === 0 || isSubmitting}
            onClick={handleGoToPrev}
            className="rounded-lg border border-border-ui bg-surface px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <p className="text-sm font-medium text-text-secondary">
            {currentItemIndex + 1}/{attempt.items.length}
          </p>
          <button
            type="button"
            disabled={!hasAnswered || isSubmitting}
            onClick={handleGoToNext}
            className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLast ? "Submit Quiz" : "Next Question"}
          </button>
        </nav>
      </section>
    );
  }

  return null;
}
