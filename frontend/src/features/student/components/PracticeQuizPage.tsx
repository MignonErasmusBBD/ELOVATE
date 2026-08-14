"use client";

import { useState } from "react";
import type { Course } from "@/features/courses/types";
import { getPracticeQuiz } from "../data/quizzes";
import type { QuizOptionId, QuizPhase } from "../types";
import { BackToLessonLink } from "./BackToLessonLink";
import { QuizQuestionCard } from "./QuizQuestionCard";
import { QuizScoreCard } from "./QuizScoreCard";
import { QuizStartCard } from "./QuizStartCard";

type PracticeQuizPageProps = {
  course: Course;
};

export function PracticeQuizPage({ course }: PracticeQuizPageProps) {
  const practiceQuiz = getPracticeQuiz(course.id);
  const questions = practiceQuiz.questions;
  const totalQuestionCount = questions.length;

  const [quizPhase, setQuizPhase] = useState<QuizPhase>("start");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<
    QuizOptionId | undefined
  >(undefined);
  const [submittedAnswers, setSubmittedAnswers] = useState<
    Partial<Record<string, QuizOptionId>>
  >({});

  const currentQuestion = questions[currentQuestionIndex];
  const submittedOptionId =
    currentQuestion === undefined
      ? undefined
      : submittedAnswers[currentQuestion.id];

  const correctAnswerCount = questions.reduce((count, question) => {
    const answer = submittedAnswers[question.id];
    if (answer === question.correctOptionId) {
      return count + 1;
    }
    return count;
  }, 0);

  function loadQuestionSelection(questionIndex: number) {
    const question = questions[questionIndex];
    if (question === undefined) {
      setSelectedOptionId(undefined);
      return;
    }

    setSelectedOptionId(submittedAnswers[question.id]);
  }

  function handleStartQuiz() {
    setQuizPhase("question");
    setCurrentQuestionIndex(0);
    setSelectedOptionId(undefined);
    setSubmittedAnswers({});
  }

  function handleSubmitAnswer() {
    if (currentQuestion === undefined || selectedOptionId === undefined) {
      return;
    }

    if (submittedAnswers[currentQuestion.id] !== undefined) {
      return;
    }

    setSubmittedAnswers((previousAnswers) => ({
      ...previousAnswers,
      [currentQuestion.id]: selectedOptionId,
    }));
  }

  function handleGoToPreviousQuestion() {
    if (currentQuestionIndex === 0) {
      return;
    }

    const previousIndex = currentQuestionIndex - 1;
    setCurrentQuestionIndex(previousIndex);
    loadQuestionSelection(previousIndex);
  }

  function handleGoToNextQuestion() {
    if (currentQuestion === undefined) {
      return;
    }

    if (submittedAnswers[currentQuestion.id] === undefined) {
      return;
    }

    const isLastQuestion = currentQuestionIndex >= totalQuestionCount - 1;
    if (isLastQuestion) {
      setQuizPhase("score");
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    loadQuestionSelection(nextIndex);
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-12">
      {quizPhase !== "score" ? (
        <header className="mb-6">
          <p className="text-sm font-medium text-text-secondary">
            {course.title}
          </p>
        </header>
      ) : undefined}

      {quizPhase === "start" ? (
        <QuizStartCard
          courseTitle={course.title}
          onStartQuiz={handleStartQuiz}
        />
      ) : undefined}

      {quizPhase === "question" && currentQuestion !== undefined ? (
        <>
          <QuizQuestionCard
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestionCount={totalQuestionCount}
            selectedOptionId={selectedOptionId}
            submittedOptionId={submittedOptionId}
            onSelectOption={setSelectedOptionId}
            onSubmitAnswer={handleSubmitAnswer}
          />
          <nav
            aria-label="Question navigation"
            className="mt-6 flex flex-wrap items-center justify-between gap-3"
          >
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={handleGoToPreviousQuestion}
              className="rounded-lg border border-border-ui bg-surface px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <p className="text-sm font-medium text-text-secondary">
              {currentQuestionIndex + 1}/{totalQuestionCount}
            </p>
            <button
              type="button"
              disabled={submittedOptionId === undefined}
              onClick={handleGoToNextQuestion}
              className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {currentQuestionIndex >= totalQuestionCount - 1
                ? "See score"
                : "Next Question"}
            </button>
          </nav>
        </>
      ) : undefined}

      {quizPhase === "score" ? (
        <QuizScoreCard
          courseId={course.id}
          correctAnswerCount={correctAnswerCount}
          totalQuestionCount={totalQuestionCount}
          backToLesson={<BackToLessonLink courseId={course.id} />}
        />
      ) : undefined}
    </section>
  );
}
