"use client";

import { useEffect, useState } from "react";
import { ExplainTip } from "@/components/ui/ExplainTip";
import { SearchField } from "@/components/ui/SearchField";
import { Spinner } from "@/components/ui/Spinner";
import { StatusPill } from "@/components/ui/StatusPill";
import { useActionFeedback } from "@/features/platform";
import { displayFormatCode } from "@/helpers/displayLabels";
import { explainCopy } from "@/helpers/explainCopy";
import { errorMessageFromUnknown } from "@/helpers/elovateApi";
import { itemsMatchingSearch } from "@/helpers/search";
import { listLearningContentSections } from "@/helpers/learningContentApi";
import {
  listBloomLevels,
  listDifficultyLevels,
  listQuestionFormats,
  type BloomLevelLookup,
  type DifficultyLevelLookup,
} from "@/helpers/lookupsApi";
import {
  activateQuestion,
  createQuestion,
  deactivateQuestion,
  listQuestions,
  updateQuestion,
  type ElovateQuestion,
} from "@/helpers/questionsApi";
import type { EducatorQuestion } from "../types";
import {
  QuestionFormModal,
  type QuestionFormLookups,
  type QuestionFormValues,
} from "./QuestionFormModal";

type QuestionsTabProps = {
  courseId: string;
  courseTitle: string;
  onReadinessChange?: (counts: {
    sectionCount: number;
    activeQuestionCount: number;
  }) => void;
};

type QuestionModalMode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; questionId: string };

type CourseSectionOption = {
  id: string;
  title: string;
};

function toEducatorQuestion(
  question: ElovateQuestion,
  sections: CourseSectionOption[],
  bloomLevels: BloomLevelLookup[],
  difficultyLevels: DifficultyLevelLookup[],
): EducatorQuestion {
  const section = sections.find(
    (entry) => entry.id === question.courseSectionId,
  );
  const bloom = bloomLevels.find(
    (level) => level.bloomLevelId === question.bloomLevelId,
  );
  const difficulty = difficultyLevels.find(
    (level) => level.difficultyLevelId === question.difficultyLevelId,
  );

  return {
    id: question.id,
    prompt: question.prompt,
    correctReason: question.correctReason,
    formatCode: question.formatCode,
    questionFormatId: question.questionFormatId,
    bloomLevelId: question.bloomLevelId,
    bloomLevelName: bloom === undefined ? `Bloom ${question.bloomLevelId}` : bloom.name,
    difficultyLevelId: question.difficultyLevelId,
    difficultyName:
      difficulty === undefined
        ? `Difficulty ${question.difficultyLevelId}`
        : difficulty.name,
    courseSectionId: question.courseSectionId,
    sectionTitle: section === undefined ? "Unknown section" : section.title,
    status: question.status,
    baseDifficulty: question.baseDifficulty,
    options: question.options,
  };
}

export function QuestionsTab({
  courseId,
  courseTitle,
  onReadinessChange,
}: QuestionsTabProps) {
  const { showSuccess } = useActionFeedback();
  const [searchQuery, setSearchQuery] = useState("");
  const [questions, setQuestions] = useState<EducatorQuestion[]>([]);
  const [sections, setSections] = useState<CourseSectionOption[]>([]);
  const [lookups, setLookups] = useState<QuestionFormLookups>({
    bloomLevels: [],
    difficultyLevels: [],
    questionFormats: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | undefined>();
  const [reloadToken, setReloadToken] = useState(0);
  const [expandedQuestionId, setExpandedQuestionId] = useState<
    string | undefined
  >();
  const [questionModalMode, setQuestionModalMode] = useState<QuestionModalMode>(
    { kind: "closed" },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<
    string | undefined
  >();

  useEffect(() => {
    let cancelled = false;

    async function loadQuestionsTab() {
      setIsLoading(true);
      setLoadErrorMessage(undefined);
      try {
        const [
          apiQuestions,
          apiSections,
          bloomLevels,
          difficultyLevels,
          questionFormats,
        ] = await Promise.all([
          listQuestions({ courseId, status: "all" }),
          listLearningContentSections(courseId),
          listBloomLevels(),
          listDifficultyLevels(),
          listQuestionFormats(),
        ]);
        if (cancelled) {
          return;
        }

        const nextSections = apiSections.map((section) => ({
          id: section.id,
          title: section.title,
        }));
        const nextLookups = {
          bloomLevels,
          difficultyLevels,
          questionFormats,
        };
        const nextQuestions = apiQuestions.map((question) =>
          toEducatorQuestion(
            question,
            nextSections,
            bloomLevels,
            difficultyLevels,
          ),
        );
        const activeQuestionCount = apiQuestions.filter(
          (question) => question.status === "active",
        ).length;

        setSections(nextSections);
        setLookups(nextLookups);
        setQuestions(nextQuestions);
        if (onReadinessChange !== undefined) {
          onReadinessChange({
            sectionCount: nextSections.length,
            activeQuestionCount,
          });
        }
        setExpandedQuestionId((currentId) => {
          if (
            currentId !== undefined &&
            nextQuestions.some((question) => question.id === currentId)
          ) {
            return currentId;
          }
          return nextQuestions[0]?.id;
        });
      } catch (error) {
        if (cancelled === false) {
          setQuestions([]);
          setSections([]);
          setLoadErrorMessage(
            errorMessageFromUnknown(error, "Could not load questions."),
          );
        }
      } finally {
        if (cancelled === false) {
          setIsLoading(false);
        }
      }
    }

    void loadQuestionsTab();
    return () => {
      cancelled = true;
    };
  }, [courseId, onReadinessChange, reloadToken]);

  const editingQuestion =
    questionModalMode.kind === "edit"
      ? questions.find(
          (question) => question.id === questionModalMode.questionId,
        )
      : undefined;

  async function handleSaveQuestion(formValues: QuestionFormValues) {
    setIsSubmitting(true);
    setSubmitErrorMessage(undefined);
    const options = formValues.options.map((option, optionIndex) => ({
      optionText: option.optionText,
      isCorrect: option.isCorrect,
      position: optionIndex,
    }));

    try {
      if (questionModalMode.kind === "create") {
        const created = await createQuestion({
          courseSectionId: formValues.courseSectionId,
          questionFormatId: formValues.questionFormatId,
          prompt: formValues.prompt,
          correctReason: formValues.correctReason,
          bloomLevelId: formValues.bloomLevelId,
          difficultyLevelId: formValues.difficultyLevelId,
          baseDifficulty: formValues.baseDifficulty,
          options,
        });
        setExpandedQuestionId(created.id);
        showSuccess(
          "Question created and active. It can now be drawn into practice quizzes for this course.",
        );
      } else if (
        questionModalMode.kind === "edit" &&
        editingQuestion !== undefined
      ) {
        await updateQuestion(editingQuestion.id, {
          courseSectionId: formValues.courseSectionId,
          prompt: formValues.prompt,
          correctReason:
            formValues.correctReason === undefined
              ? ""
              : formValues.correctReason,
          questionFormatId: formValues.questionFormatId,
          bloomLevelId: formValues.bloomLevelId,
          difficultyLevelId: formValues.difficultyLevelId,
          baseDifficulty: formValues.baseDifficulty,
          options,
        });
        showSuccess("Question updated.");
      }
      setQuestionModalMode({ kind: "closed" });
      setReloadToken((currentToken) => currentToken + 1);
    } catch (error) {
      setSubmitErrorMessage(
        errorMessageFromUnknown(error, "Could not save question."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(question: EducatorQuestion) {
    setLoadErrorMessage(undefined);
    try {
      if (question.status === "active") {
        await deactivateQuestion(question.id);
        showSuccess(
          "Question deactivated. Existing quiz history is kept, but new quizzes will not draw this item.",
        );
      } else {
        await activateQuestion(question.id);
        showSuccess(
          "Question activated. New practice quizzes can draw this item again.",
        );
      }
      setReloadToken((currentToken) => currentToken + 1);
    } catch (error) {
      setLoadErrorMessage(
        errorMessageFromUnknown(error, "Could not update question status."),
      );
    }
  }

  function openCreateModal() {
    setSubmitErrorMessage(undefined);
    setLoadErrorMessage(undefined);
    setQuestionModalMode({ kind: "create" });
  }

  const visibleQuestions = itemsMatchingSearch(
    questions,
    searchQuery,
    (question) => [
      question.prompt,
      displayFormatCode(question.formatCode),
      question.bloomLevelName,
      question.difficultyName,
      question.sectionTitle,
    ],
  );

  return (
    <section aria-labelledby="questions-heading" className="mt-6 min-w-0">
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2
          id="questions-heading"
          className="flex min-w-0 items-center gap-1.5 break-words text-xl font-bold tracking-tight text-ink"
        >
          Questions for {courseTitle}
          <ExplainTip label="About the question bank">
            {explainCopy.questionsBank}
          </ExplainTip>
        </h2>
        <button
          type="button"
          onClick={openCreateModal}
          disabled={isLoading}
          className="self-start rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:brightness-[0.97] disabled:opacity-50"
        >
          + Add Question
        </button>
      </header>

      {questions.length > 0 ? (
        <section className="mt-4">
          <SearchField
            id="questions-search"
            label="Search questions"
            placeholder="Search questions"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </section>
      ) : undefined}

      {isLoading ? (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-text-secondary">
          <Spinner className="size-4" />
          Loading questions…
        </p>
      ) : undefined}

      {loadErrorMessage === undefined ? undefined : (
        <p className="mt-4 text-sm text-coral" role="alert">
          {loadErrorMessage}
        </p>
      )}

      {isLoading === false &&
      loadErrorMessage === undefined &&
      questions.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          No questions yet. Add a question to get started.
        </p>
      ) : undefined}

      {questions.length > 0 && visibleQuestions.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          No questions match your search.
        </p>
      ) : undefined}

      {visibleQuestions.length === 0 ? undefined : (
        <ul className="mt-4 flex list-none flex-col gap-3 p-0">
          {visibleQuestions.map((question) => {
            const isExpanded = expandedQuestionId === question.id;
            const isActive = question.status === "active";

            return (
              <li key={question.id} className="min-w-0">
                <article className="min-w-0 overflow-hidden rounded-2xl border border-border-ui bg-surface shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
                  <button
                    type="button"
                    className="flex w-full min-w-0 items-start justify-between gap-3 px-4 py-4 text-left sm:px-5"
                    onClick={() =>
                      setExpandedQuestionId(
                        isExpanded ? undefined : question.id,
                      )
                    }
                    aria-expanded={isExpanded}
                  >
                    <span className="min-w-0">
                      <span className="block break-words text-base font-bold text-ink">
                        {question.prompt}
                      </span>
                      <ul className="mt-2 flex list-none flex-wrap gap-2 p-0">
                        <li className="rounded-full bg-ink/10 px-2.5 py-1 text-xs font-semibold text-ink">
                          {displayFormatCode(question.formatCode)}
                        </li>
                        <li className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">
                          {question.bloomLevelName}
                        </li>
                        <li className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">
                          {question.difficultyName}
                        </li>
                        <li className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                          {question.sectionTitle}
                        </li>
                        <li>
                          <StatusPill
                            label={isActive ? "Active" : "Inactive"}
                            tone={isActive ? "success" : "warning"}
                          />
                        </li>
                      </ul>
                    </span>
                    <span className="text-sm font-semibold text-text-secondary">
                      {isExpanded ? "▴" : "▾"}
                    </span>
                  </button>

                  {isExpanded ? (
                    <section className="min-w-0 border-t border-border-ui px-4 py-4 sm:px-5">
                      <h3 className="text-sm font-semibold text-ink">
                        Options
                      </h3>
                      <ul className="mt-2 flex list-none flex-col gap-2 p-0">
                        {question.options.map((option) => (
                          <li
                            key={option.id}
                            className={`break-words rounded-lg border px-3 py-2 text-sm ${
                              option.isCorrect
                                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                : "border-border-ui bg-page text-text-secondary"
                            }`}
                          >
                            {option.optionText}
                            {option.isCorrect ? (
                              <span className="ml-2 text-xs font-semibold">
                                Correct
                              </span>
                            ) : undefined}
                          </li>
                        ))}
                      </ul>
                      {question.correctReason === undefined ? undefined : (
                        <p className="mt-4 rounded-lg bg-page px-3 py-2 text-sm text-ink">
                          <span className="font-semibold">
                            Why this is correct:{" "}
                          </span>
                          {question.correctReason}
                        </p>
                      )}
                      <menu className="mt-4 flex list-none flex-wrap gap-2 p-0">
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setSubmitErrorMessage(undefined);
                              setQuestionModalMode({
                                kind: "edit",
                                questionId: question.id,
                              });
                            }}
                            className="rounded-lg border border-ink bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-page"
                          >
                            Edit Question
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              void handleToggleStatus(question);
                            }}
                            className={
                              isActive
                                ? "rounded-lg bg-coral px-3 py-2 text-sm font-semibold text-white hover:brightness-[0.97]"
                                : "rounded-lg border border-emerald-600 bg-surface px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                            }
                          >
                            {isActive ? "Deactivate" : "Activate"}
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
      )}

      {questionModalMode.kind === "create" ? (
        <QuestionFormModal
          sections={sections}
          lookups={lookups}
          isSubmitting={isSubmitting}
          submitErrorMessage={submitErrorMessage}
          onClose={() => {
            if (isSubmitting === false) {
              setQuestionModalMode({ kind: "closed" });
            }
          }}
          onSave={handleSaveQuestion}
        />
      ) : undefined}

      {questionModalMode.kind === "edit" && editingQuestion !== undefined ? (
        <QuestionFormModal
          initialQuestion={editingQuestion}
          sections={sections}
          lookups={lookups}
          isSubmitting={isSubmitting}
          submitErrorMessage={submitErrorMessage}
          onClose={() => {
            if (isSubmitting === false) {
              setQuestionModalMode({ kind: "closed" });
            }
          }}
          onSave={handleSaveQuestion}
        />
      ) : undefined}
    </section>
  );
}
