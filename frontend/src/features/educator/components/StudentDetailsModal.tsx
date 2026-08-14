"use client";

import { useEffect } from "react";
import type { EducatorStudentSummary } from "../types";
import { StudentCognitiveLevelChart } from "./StudentCognitiveLevelChart";

type StudentDetailsModalProps = {
  student: EducatorStudentSummary;
  onClose: () => void;
  onMarkInterventionsResolved: () => void;
};

export function StudentDetailsModal({
  student,
  onClose,
  onMarkInterventionsResolved,
}: StudentDetailsModalProps) {
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
        aria-labelledby="student-details-title"
        className="my-4 w-full max-w-4xl rounded-2xl border border-border-ui bg-surface p-6 shadow-[0_16px_48px_rgba(30,27,51,0.2)] md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <h2
            id="student-details-title"
            className="text-2xl font-bold tracking-tight text-ink"
          >
            {student.fullName} — Detailed Overview
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-lg font-semibold text-text-secondary hover:bg-page"
            aria-label="Close student details"
          >
            ×
          </button>
        </header>

        <ul className="mt-6 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3">
          <li>
            <article className="rounded-xl border border-border-ui border-l-4 border-l-emerald-600 bg-surface px-4 py-3">
              <h3 className="text-xs font-semibold text-emerald-700">
                Practice Quiz
              </h3>
              <p className="mt-1 text-xl font-bold text-ink">
                {student.practiceQuizPercent}%
              </p>
            </article>
          </li>
          <li>
            <article className="rounded-xl border border-border-ui border-l-4 border-l-coral bg-surface px-4 py-3">
              <h3 className="text-xs font-semibold text-coral">Improvement</h3>
              <p className="mt-1 text-xl font-bold text-ink">
                {student.improvementLabel}
              </p>
            </article>
          </li>
          <li>
            <article className="rounded-xl border border-border-ui border-l-4 border-l-sky-600 bg-surface px-4 py-3">
              <h3 className="text-xs font-semibold text-sky-700">Time Spent</h3>
              <p className="mt-1 text-xl font-bold text-ink">
                {student.timeSpentLabel}
              </p>
            </article>
          </li>
        </ul>

        <section className="mt-6 rounded-2xl border border-border-ui p-5">
          <h3 className="text-base font-bold text-ink">
            Performance by Cognitive Level
          </h3>
          <StudentCognitiveLevelChart
            cognitiveLevels={student.cognitiveLevels}
          />
        </section>

        <section className="mt-6 rounded-xl border border-coral/40 bg-coral/10 p-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <section>
              <h3 className="text-base font-bold text-coral">
                Trigger Interventions
              </h3>
              <p className="mt-1 text-sm text-ink">Cognitive Support</p>
            </section>
            <button
              type="button"
              onClick={onMarkInterventionsResolved}
              className="rounded-lg bg-coral px-3 py-2 text-sm font-semibold text-white hover:brightness-[0.97]"
            >
              Mark as Resolved
            </button>
          </header>
          {student.interventionLabels.length === 0 ? (
            <p className="mt-3 text-sm text-text-secondary">
              No open interventions.
            </p>
          ) : (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-coral">
              {student.interventionLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </div>
  );
}
