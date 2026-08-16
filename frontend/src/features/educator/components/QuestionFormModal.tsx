"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { displayFormatCode } from "@/helpers/displayLabels";
import type {
  BloomLevelLookup,
  DifficultyLevelLookup,
  QuestionFormatLookup,
} from "@/helpers/lookupsApi";
import { baseDifficultyFromRank } from "@/helpers/questionsApi";
import type { EducatorQuestion } from "../types";

export type QuestionFormOption = {
  key: string;
  optionText: string;
  isCorrect: boolean;
};

export type QuestionFormValues = {
  prompt: string;
  correctReason: string | undefined;
  courseSectionId: string;
  questionFormatId: number;
  bloomLevelId: number;
  difficultyLevelId: number;
  baseDifficulty: number;
  options: QuestionFormOption[];
};

const CORRECT_REASON_MAX_LENGTH = 1000;

export type QuestionFormLookups = {
  bloomLevels: BloomLevelLookup[];
  difficultyLevels: DifficultyLevelLookup[];
  questionFormats: QuestionFormatLookup[];
};

type QuestionFormSectionOption = {
  id: string;
  title: string;
};

type QuestionFormModalProps = {
  initialQuestion?: EducatorQuestion;
  sections: QuestionFormSectionOption[];
  lookups: QuestionFormLookups;
  isSubmitting?: boolean;
  submitErrorMessage?: string;
  onClose: () => void;
  onSave: (formValues: QuestionFormValues) => void | Promise<void>;
};

function defaultOptions(): QuestionFormOption[] {
  return [
    { key: "opt-0", optionText: "", isCorrect: true },
    { key: "opt-1", optionText: "", isCorrect: false },
  ];
}

function mcqFormatId(formats: QuestionFormatLookup[]): number | undefined {
  const mcq = formats.find((format) => format.formatCode === "mcq");
  if (mcq !== undefined) {
    return mcq.questionFormatId;
  }
  return formats[0]?.questionFormatId;
}

export function QuestionFormModal({
  initialQuestion,
  sections,
  lookups,
  isSubmitting = false,
  submitErrorMessage,
  onClose,
  onSave,
}: QuestionFormModalProps) {
  const isEditing = initialQuestion !== undefined;
  const mcqFormats = lookups.questionFormats.filter(
    (format) => format.formatCode === "mcq",
  );
  const availableFormats =
    mcqFormats.length > 0 ? mcqFormats : lookups.questionFormats;

  const initialFormatId =
    initialQuestion?.questionFormatId ??
    mcqFormatId(availableFormats) ??
    0;
  const initialBloomId =
    initialQuestion?.bloomLevelId ?? lookups.bloomLevels[0]?.bloomLevelId ?? 0;
  const initialDifficultyId =
    initialQuestion?.difficultyLevelId ??
    lookups.difficultyLevels[0]?.difficultyLevelId ??
    0;
  const initialSectionId =
    initialQuestion?.courseSectionId ?? sections[0]?.id ?? "";

  const [questionPrompt, setQuestionPrompt] = useState(
    initialQuestion?.prompt ?? "",
  );
  const [correctReason, setCorrectReason] = useState(
    initialQuestion?.correctReason ?? "",
  );
  const [courseSectionId, setCourseSectionId] = useState(initialSectionId);
  const [questionFormatId, setQuestionFormatId] = useState(initialFormatId);
  const [bloomLevelId, setBloomLevelId] = useState(initialBloomId);
  const [difficultyLevelId, setDifficultyLevelId] =
    useState(initialDifficultyId);
  const [options, setOptions] = useState<QuestionFormOption[]>(() => {
    if (initialQuestion === undefined || initialQuestion.options.length === 0) {
      return defaultOptions();
    }
    return initialQuestion.options.map((option, optionIndex) => ({
      key: option.id === "" ? `opt-${optionIndex}` : option.id,
      optionText: option.optionText,
      isCorrect: option.isCorrect,
    }));
  });
  const [validationMessage, setValidationMessage] = useState<
    string | undefined
  >();

  useEffect(() => {
    setCourseSectionId((id) =>
      id === "" && sections[0] !== undefined ? sections[0].id : id,
    );
  }, [sections]);

  useEffect(() => {
    setBloomLevelId((id) =>
      id === 0 && lookups.bloomLevels[0] !== undefined
        ? lookups.bloomLevels[0].bloomLevelId
        : id,
    );
    setDifficultyLevelId((id) =>
      id === 0 && lookups.difficultyLevels[0] !== undefined
        ? lookups.difficultyLevels[0].difficultyLevelId
        : id,
    );
    setQuestionFormatId((id) => {
      if (id !== 0) {
        return id;
      }
      return mcqFormatId(lookups.questionFormats) ?? id;
    });
  }, [lookups]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isSubmitting === false) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  function updateOption(
    optionKey: string,
    patch: Partial<Pick<QuestionFormOption, "optionText" | "isCorrect">>,
  ) {
    setOptions((previousOptions) =>
      previousOptions.map((option) => {
        if (option.key !== optionKey) {
          if (patch.isCorrect === true) {
            return { ...option, isCorrect: false };
          }
          return option;
        }
        return { ...option, ...patch };
      }),
    );
  }

  function removeOption(optionKey: string) {
    setOptions((previousOptions) => {
      if (previousOptions.length <= 2) {
        return previousOptions;
      }
      const nextOptions = previousOptions.filter(
        (option) => option.key !== optionKey,
      );
      const hasCorrect = nextOptions.some((option) => option.isCorrect);
      if (hasCorrect) {
        return nextOptions;
      }
      const firstOption = nextOptions[0];
      if (firstOption === undefined) {
        return nextOptions;
      }
      return nextOptions.map((option, optionIndex) => ({
        ...option,
        isCorrect: optionIndex === 0,
      }));
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 md:p-8"
      role="presentation"
      onClick={() => {
        if (isSubmitting === false) {
          onClose();
        }
      }}
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-form-title"
        className="my-4 w-full max-w-4xl rounded-2xl border border-border-ui bg-surface p-6 shadow-[0_16px_48px_rgba(30,27,51,0.2)] md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <h2
            id="question-form-title"
            className="text-2xl font-bold tracking-tight text-ink"
          >
            {isEditing ? "Edit Question" : "Add New Question"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg px-2 py-1 text-lg font-semibold text-text-secondary hover:bg-page"
            aria-label="Close question form"
          >
            ×
          </button>
        </header>

        {sections.length === 0 ? (
          <p className="mt-6 text-sm text-coral" role="status">
            Add a Learning Content section for this course before creating
            questions.
          </p>
        ) : undefined}

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setValidationMessage(undefined);

            if (sections.length === 0) {
              setValidationMessage(
                "Add a Learning Content section before creating questions.",
              );
              return;
            }
            if (questionPrompt.trim() === "") {
              setValidationMessage("Question text is required.");
              return;
            }
            if (courseSectionId === "") {
              setValidationMessage("Select a section.");
              return;
            }

            const filledOptions = options.filter(
              (option) => option.optionText.trim() !== "",
            );
            if (filledOptions.length < 2) {
              setValidationMessage("Add at least two answer options.");
              return;
            }
            const correctCount = filledOptions.filter(
              (option) => option.isCorrect,
            ).length;
            if (correctCount !== 1) {
              setValidationMessage("Mark exactly one option as correct.");
              return;
            }

            const selectedDifficulty = lookups.difficultyLevels.find(
              (level) => level.difficultyLevelId === difficultyLevelId,
            );
            const difficultyRank =
              selectedDifficulty === undefined ? 1 : selectedDifficulty.rank;

            const trimmedReason = correctReason.trim();
            void onSave({
              prompt: questionPrompt.trim(),
              correctReason: trimmedReason === "" ? undefined : trimmedReason,
              courseSectionId,
              questionFormatId,
              bloomLevelId,
              difficultyLevelId,
              baseDifficulty: baseDifficultyFromRank(difficultyRank),
              options: filledOptions.map((option, optionIndex) => ({
                key: option.key,
                optionText: option.optionText.trim(),
                isCorrect: option.isCorrect,
              })),
            });
          }}
        >
          <label className="block">
            <span className="text-sm font-semibold text-ink">
              Question Text *
            </span>
            <textarea
              required
              value={questionPrompt}
              disabled={isSubmitting}
              onChange={(event) => setQuestionPrompt(event.target.value)}
              placeholder="Enter your question here..."
              className="mt-2 min-h-28 w-full rounded-lg border border-border-ui bg-surface px-3 py-2 text-sm text-ink"
            />
          </label>

          <fieldset className="grid grid-cols-1 gap-4 border-0 p-0 md:grid-cols-2">
            <legend className="sr-only">Question attributes</legend>
            <label className="block">
              <span className="text-sm font-semibold text-ink">Section *</span>
              <select
                value={courseSectionId}
                disabled={isSubmitting || sections.length === 0}
                onChange={(event) => setCourseSectionId(event.target.value)}
                className="mt-2 w-full rounded-lg border border-border-ui bg-surface px-3 py-2.5 text-sm text-ink"
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink">Format *</span>
              <select
                value={questionFormatId}
                disabled={isSubmitting}
                onChange={(event) => {
                  const nextId = Number.parseInt(event.target.value, 10);
                  if (Number.isNaN(nextId)) {
                    return;
                  }
                  setQuestionFormatId(nextId);
                }}
                className="mt-2 w-full rounded-lg border border-border-ui bg-surface px-3 py-2.5 text-sm text-ink"
              >
                {availableFormats.map((format) => (
                  <option
                    key={format.questionFormatId}
                    value={format.questionFormatId}
                  >
                    {displayFormatCode(format.formatCode)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Difficulty *
              </span>
              <select
                value={difficultyLevelId}
                disabled={isSubmitting}
                onChange={(event) => {
                  const nextId = Number.parseInt(event.target.value, 10);
                  if (Number.isNaN(nextId)) {
                    return;
                  }
                  setDifficultyLevelId(nextId);
                }}
                className="mt-2 w-full rounded-lg border border-border-ui bg-surface px-3 py-2.5 text-sm text-ink"
              >
                {lookups.difficultyLevels.map((level) => (
                  <option
                    key={level.difficultyLevelId}
                    value={level.difficultyLevelId}
                  >
                    {level.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Bloom Level *
              </span>
              <select
                value={bloomLevelId}
                disabled={isSubmitting}
                onChange={(event) => {
                  const nextId = Number.parseInt(event.target.value, 10);
                  if (Number.isNaN(nextId)) {
                    return;
                  }
                  setBloomLevelId(nextId);
                }}
                className="mt-2 w-full rounded-lg border border-border-ui bg-surface px-3 py-2.5 text-sm text-ink"
              >
                {lookups.bloomLevels.map((level) => (
                  <option key={level.bloomLevelId} value={level.bloomLevelId}>
                    {level.name}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold text-ink">
              Answer options *
            </legend>
            <p className="text-sm text-text-secondary">
              Provide at least two options and mark exactly one as correct.
            </p>
            {options.map((option, optionIndex) => (
              <article
                key={option.key}
                className="rounded-xl border border-border-ui bg-page p-4"
              >
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-ink">
                    <input
                      type="radio"
                      name="correct-option"
                      checked={option.isCorrect}
                      disabled={isSubmitting}
                      onChange={() =>
                        updateOption(option.key, { isCorrect: true })
                      }
                    />
                    <span>Correct answer</span>
                  </label>
                  <button
                    type="button"
                    disabled={isSubmitting || options.length <= 2}
                    onClick={() => removeOption(option.key)}
                    className="rounded-lg border border-border-ui bg-surface px-2 py-1 text-xs font-semibold text-coral disabled:opacity-40"
                  >
                    Remove
                  </button>
                </header>
                <label className="mt-3 block">
                  <span className="sr-only">Option {optionIndex + 1}</span>
                  <input
                    type="text"
                    value={option.optionText}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      updateOption(option.key, {
                        optionText: event.target.value,
                      })
                    }
                    placeholder={`Option ${optionIndex + 1}`}
                    className="w-full rounded-lg border border-border-ui bg-surface px-3 py-2 text-sm text-ink"
                  />
                </label>
              </article>
            ))}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                setOptions((previousOptions) => [
                  ...previousOptions,
                  {
                    key: `opt-${Date.now()}-${previousOptions.length}`,
                    optionText: "",
                    isCorrect: false,
                  },
                ])
              }
              className="self-start rounded-lg border border-ink bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-page"
            >
              + Add option
            </button>
          </fieldset>

          <label className="block">
            <span className="text-sm font-semibold text-ink">
              Why is this correct?{" "}
              <span className="font-normal text-text-secondary">(optional)</span>
            </span>
            <textarea
              value={correctReason}
              disabled={isSubmitting}
              maxLength={CORRECT_REASON_MAX_LENGTH}
              onChange={(event) => setCorrectReason(event.target.value)}
              placeholder="Explain why the correct answer is right. Learners see this when they review."
              className="mt-2 min-h-24 w-full rounded-lg border border-border-ui bg-surface px-3 py-2 text-sm text-ink"
            />
            <span className="mt-1 block text-xs text-text-secondary">
              {correctReason.length}/{CORRECT_REASON_MAX_LENGTH} characters
            </span>
          </label>

          {validationMessage === undefined ? undefined : (
            <p className="text-sm text-coral" role="alert">
              {validationMessage}
            </p>
          )}
          {submitErrorMessage === undefined ? undefined : (
            <p className="text-sm text-coral" role="alert">
              {submitErrorMessage}
            </p>
          )}

          <menu className="mt-2 flex list-none justify-end gap-3 p-0">
            <li>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg border border-border-ui bg-surface px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-page"
              >
                Cancel
              </button>
            </li>
            <li>
              <button
                type="submit"
                disabled={isSubmitting || sections.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:brightness-[0.97] disabled:opacity-60"
              >
                {isSubmitting ? <Spinner className="size-4" /> : undefined}
                {isSubmitting
                  ? "Saving…"
                  : isEditing
                    ? "Save Changes"
                    : "Create Question"}
              </button>
            </li>
          </menu>
        </form>
      </article>
    </div>
  );
}
