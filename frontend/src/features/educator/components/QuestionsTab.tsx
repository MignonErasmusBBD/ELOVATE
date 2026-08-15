"use client";

import { useState } from "react";
import type { EducatorQuestion } from "../types";
import { QuestionFormModal } from "./QuestionFormModal";

type QuestionsTabProps = {
  courseTitle: string;
  questions: EducatorQuestion[];
};

type QuestionModalMode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; questionId: string };

export function QuestionsTab({ courseTitle, questions }: QuestionsTabProps) {
  const [expandedQuestionId, setExpandedQuestionId] = useState<
    string | undefined
  >(questions[0]?.id);
  const [questionModalMode, setQuestionModalMode] = useState<QuestionModalMode>(
    { kind: "closed" },
  );
  const [localQuestions, setLocalQuestions] = useState(questions);

  const editingQuestion =
    questionModalMode.kind === "edit"
      ? localQuestions.find(
          (question) => question.id === questionModalMode.questionId,
        )
      : undefined;

  return (
    <section aria-labelledby="questions-heading" className="mt-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="questions-heading"
          className="text-xl font-bold tracking-tight text-ink"
        >
          Questions for {courseTitle}
        </h2>
        <button
          type="button"
          onClick={() => setQuestionModalMode({ kind: "create" })}
          className="rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:brightness-[0.97]"
        >
          + Add Question
        </button>
      </header>

      <ul className="mt-4 flex list-none flex-col gap-3 p-0">
        {localQuestions.map((question) => {
          const isExpanded = expandedQuestionId === question.id;

          return (
            <li key={question.id}>
              <article className="rounded-2xl border border-border-ui bg-surface shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
                  onClick={() =>
                    setExpandedQuestionId(isExpanded ? undefined : question.id)
                  }
                  aria-expanded={isExpanded}
                >
                  <span className="min-w-0">
                    <span className="block text-base font-bold text-ink">
                      {question.prompt}
                    </span>
                    <ul className="mt-2 flex list-none flex-wrap gap-2 p-0">
                      <li className="rounded-full bg-ink/10 px-2.5 py-1 text-xs font-semibold text-ink">
                        {question.format}
                      </li>
                      <li className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">
                        {question.bloomLevel}
                      </li>
                      <li className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">
                        {question.difficulty}
                      </li>
                      <li className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        {question.sectionName}
                      </li>
                      {question.quizTypes.map((quizType) => (
                        <li
                          key={quizType}
                          className="rounded-full bg-coral/15 px-2.5 py-1 text-xs font-semibold text-coral"
                        >
                          {quizType}
                        </li>
                      ))}
                    </ul>
                  </span>
                  <span className="text-sm font-semibold text-text-secondary">
                    {isExpanded ? "▴" : "▾"}
                  </span>
                </button>

                {isExpanded ? (
                  <section className="border-t border-border-ui px-5 py-4">
                    <p className="text-sm text-text-secondary">
                      Points: {question.points}
                    </p>
                    <h3 className="mt-4 text-sm font-semibold text-ink">
                      Question Data:
                    </h3>
                    <pre className="mt-2 overflow-x-auto rounded-xl bg-page p-3 text-xs text-ink">
                      <code>{question.questionDataJson}</code>
                    </pre>
                    <h3 className="mt-4 text-sm font-semibold text-ink">
                      Correct Answer:
                    </h3>
                    <pre className="mt-2 overflow-x-auto rounded-xl bg-page p-3 text-xs text-ink">
                      <code>{question.answerDataJson}</code>
                    </pre>
                    <menu className="mt-4 flex list-none gap-2 p-0">
                      <li>
                        <button
                          type="button"
                          onClick={() =>
                            setQuestionModalMode({
                              kind: "edit",
                              questionId: question.id,
                            })
                          }
                          className="rounded-lg border border-ink bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-page"
                        >
                          Edit Question
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="rounded-lg bg-coral px-3 py-2 text-sm font-semibold text-white hover:brightness-[0.97]"
                        >
                          Deactivate
                        </button>
                      </li>
                    </menu>
                  </section>
                ) : undefined}
              </article>
            </li>
          );
        })}
      </ul>

      {questionModalMode.kind === "create" ? (
        <QuestionFormModal
          onClose={() => setQuestionModalMode({ kind: "closed" })}
          onSave={(formValues) => {
            const newQuestion: EducatorQuestion = {
              id: `q-${localQuestions.length + 1}`,
              prompt: formValues.prompt,
              format: formValues.format,
              bloomLevel: formValues.bloomLevel,
              difficulty: formValues.difficulty,
              sectionName: formValues.sectionName,
              quizTypes: ["Practice Quiz"],
              points: formValues.points,
              questionDataJson: formValues.questionDataJson,
              answerDataJson: formValues.answerDataJson,
              isActive: true,
            };
            setLocalQuestions((previousQuestions) => [
              newQuestion,
              ...previousQuestions,
            ]);
            setExpandedQuestionId(newQuestion.id);
            setQuestionModalMode({ kind: "closed" });
          }}
        />
      ) : undefined}

      {questionModalMode.kind === "edit" && editingQuestion !== undefined ? (
        <QuestionFormModal
          initialQuestion={editingQuestion}
          onClose={() => setQuestionModalMode({ kind: "closed" })}
          onSave={(formValues) => {
            setLocalQuestions((previousQuestions) =>
              previousQuestions.map((question) => {
                if (question.id !== editingQuestion.id) {
                  return question;
                }

                return {
                  ...question,
                  prompt: formValues.prompt,
                  format: formValues.format,
                  bloomLevel: formValues.bloomLevel,
                  difficulty: formValues.difficulty,
                  sectionName: formValues.sectionName,
                  points: formValues.points,
                  questionDataJson: formValues.questionDataJson,
                  answerDataJson: formValues.answerDataJson,
                };
              }),
            );
            setQuestionModalMode({ kind: "closed" });
          }}
        />
      ) : undefined}
    </section>
  );
}
