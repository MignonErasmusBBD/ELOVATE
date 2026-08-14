"use client";

import { useEffect, useState } from "react";
import type { EducatorQuestion, EducatorQuestionFormat } from "../types";

export type QuestionFormValues = {
  prompt: string;
  format: EducatorQuestionFormat;
  difficulty: string;
  bloomLevel: string;
  sectionName: string;
  points: number;
  questionDataJson: string;
  answerDataJson: string;
};

type QuestionFormModalProps = {
  initialQuestion?: EducatorQuestion;
  onClose: () => void;
  onSave: (formValues: QuestionFormValues) => void;
};

function parsePointsValue(pointsValue: string) {
  const parsedPoints = Number.parseInt(pointsValue, 10);
  if (Number.isNaN(parsedPoints) || parsedPoints < 1) {
    return 1;
  }
  return parsedPoints;
}

export function QuestionFormModal({
  initialQuestion,
  onClose,
  onSave,
}: QuestionFormModalProps) {
  const isEditing = initialQuestion !== undefined;

  const [questionPrompt, setQuestionPrompt] = useState(
    initialQuestion?.prompt ?? "",
  );
  const [questionFormat, setQuestionFormat] = useState<EducatorQuestionFormat>(
    initialQuestion?.format ?? "multiple-choice",
  );
  const [difficulty, setDifficulty] = useState(
    initialQuestion?.difficulty ?? "Easy",
  );
  const [bloomLevel, setBloomLevel] = useState(
    initialQuestion?.bloomLevel ?? "Remember",
  );
  const [sectionName, setSectionName] = useState(
    initialQuestion?.sectionName ?? "Theory & Concepts",
  );
  const [points, setPoints] = useState(
    initialQuestion === undefined ? "1" : `${initialQuestion.points}`,
  );
  const [questionDataJson, setQuestionDataJson] = useState(
    initialQuestion?.questionDataJson ?? "{}",
  );
  const [answerDataJson, setAnswerDataJson] = useState(
    initialQuestion?.answerDataJson ?? "{}",
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 md:p-8"
      role="presentation"
      onClick={onClose}
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
            className="rounded-lg px-2 py-1 text-lg font-semibold text-text-secondary hover:bg-page"
            aria-label="Close question form"
          >
            ×
          </button>
        </header>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (questionPrompt.trim() === "") {
              return;
            }

            onSave({
              prompt: questionPrompt.trim(),
              format: questionFormat,
              difficulty,
              bloomLevel,
              sectionName,
              points: parsePointsValue(points),
              questionDataJson,
              answerDataJson,
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
              onChange={(event) => setQuestionPrompt(event.target.value)}
              placeholder="Enter your question here..."
              className="mt-2 min-h-28 w-full rounded-lg border border-border-ui bg-surface px-3 py-2 text-sm text-ink"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink">
              Question Format *
            </span>
            <select
              value={questionFormat}
              onChange={(event) => {
                if (event.target.value === "multiple-choice") {
                  setQuestionFormat("multiple-choice");
                }
              }}
              className="mt-2 w-full rounded-lg border border-border-ui bg-surface px-3 py-2.5 text-sm text-ink"
            >
              <option value="multiple-choice">multiple-choice</option>
            </select>
          </label>

          <fieldset className="grid grid-cols-1 gap-4 border-0 p-0 md:grid-cols-3">
            <legend className="sr-only">Question attributes</legend>
            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Difficulty *
              </span>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className="mt-2 w-full rounded-lg border border-border-ui bg-surface px-3 py-2.5 text-sm text-ink"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Bloom Level *
              </span>
              <select
                value={bloomLevel}
                onChange={(event) => setBloomLevel(event.target.value)}
                className="mt-2 w-full rounded-lg border border-border-ui bg-surface px-3 py-2.5 text-sm text-ink"
              >
                <option value="Remember">Remember</option>
                <option value="Understand">Understand</option>
                <option value="Apply">Apply</option>
                <option value="Analyze">Analyze</option>
                <option value="Evaluate">Evaluate</option>
                <option value="Create">Create</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink">Section *</span>
              <select
                value={sectionName}
                onChange={(event) => setSectionName(event.target.value)}
                className="mt-2 w-full rounded-lg border border-border-ui bg-surface px-3 py-2.5 text-sm text-ink"
              >
                <option value="Theory & Concepts">Theory & Concepts</option>
                <option value="Code Implementation">Code Implementation</option>
                <option value="Pattern Participants/Relationships">
                  Pattern Participants/Relationships
                </option>
                <option value="UML Diagrams">UML Diagrams</option>
              </select>
            </label>
          </fieldset>

          <label className="block">
            <span className="text-sm font-semibold text-ink">Points *</span>
            <input
              type="number"
              min={1}
              value={points}
              onChange={(event) => setPoints(event.target.value)}
              className="mt-2 w-full rounded-lg border border-border-ui bg-surface px-3 py-2.5 text-sm text-ink"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink">
              Question Data (JSON)
            </span>
            <textarea
              value={questionDataJson}
              onChange={(event) => setQuestionDataJson(event.target.value)}
              className="mt-2 min-h-28 w-full rounded-lg border border-border-ui bg-page px-3 py-2 font-mono text-xs text-ink"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink">
              Question Answer (JSON)
            </span>
            <textarea
              value={answerDataJson}
              onChange={(event) => setAnswerDataJson(event.target.value)}
              className="mt-2 min-h-28 w-full rounded-lg border border-border-ui bg-page px-3 py-2 font-mono text-xs text-ink"
            />
          </label>

          <menu className="mt-2 flex list-none justify-end gap-3 p-0">
            <li>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border-ui bg-surface px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-page"
              >
                Cancel
              </button>
            </li>
            <li>
              <button
                type="submit"
                className="rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:brightness-[0.97]"
              >
                {isEditing ? "Save Changes" : "Create Question"}
              </button>
            </li>
          </menu>
        </form>
      </article>
    </div>
  );
}
