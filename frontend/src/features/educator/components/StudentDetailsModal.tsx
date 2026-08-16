"use client";

import { useEffect } from "react";
import { ExplainTip } from "@/components/ui/ExplainTip";
import { StatusPill } from "@/components/ui/StatusPill";
import { explainCopy } from "@/helpers/explainCopy";
import type { EducatorStudentSummary } from "../types";
import { StudentCognitiveLevelChart } from "./StudentCognitiveLevelChart";

type StudentDetailsModalProps = {
  student: EducatorStudentSummary;
  onClose: () => void;
};

function statusPillTone(status: EducatorStudentSummary["status"]) {
  if (status === "active") {
    return "success" as const;
  }
  if (status === "completed") {
    return "muted" as const;
  }
  return "warning" as const;
}

function statusLabel(status: EducatorStudentSummary["status"]) {
  if (status === "active") {
    return "Active";
  }
  if (status === "completed") {
    return "Completed";
  }
  return "Withdrawn";
}

export function StudentDetailsModal({
  student,
  onClose,
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

  const hasCognitiveLevels = student.cognitiveLevels.length > 0;
  const hasInterventions = student.interventionLabels.length > 0;

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
          <section>
            <h2
              id="student-details-title"
              className="text-2xl font-bold tracking-tight text-ink"
            >
              {student.fullName}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {student.emailAddress}
            </p>
          </section>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-lg font-semibold text-text-secondary hover:bg-page"
            aria-label="Close student details"
          >
            ×
          </button>
        </header>

        <ul className="mt-6 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
          <li>
            <article className="rounded-xl border border-border-ui border-l-4 border-l-emerald-600 bg-surface px-4 py-3">
              <h3 className="text-xs font-semibold text-emerald-700">Status</h3>
              <p className="mt-2">
                <StatusPill
                  label={statusLabel(student.status)}
                  tone={statusPillTone(student.status)}
                />
              </p>
            </article>
          </li>
          <li>
            <article className="rounded-xl border border-border-ui border-l-4 border-l-coral bg-surface px-4 py-3">
              <h3 className="text-xs font-semibold text-coral">Enrolled</h3>
              <p className="mt-1 text-xl font-bold text-ink">
                {student.enrolledAtLabel}
              </p>
            </article>
          </li>
          <li>
            <article className="rounded-xl border border-border-ui border-l-4 border-l-sky-600 bg-surface px-4 py-3">
              <h3 className="text-xs font-semibold text-sky-700">
                Practice Quiz
              </h3>
              <p className="mt-1 text-xl font-bold text-ink">
                {student.practiceQuizPercent === undefined
                  ? "—"
                  : `${student.practiceQuizPercent}%`}
              </p>
            </article>
          </li>
          <li>
            <article className="rounded-xl border border-border-ui border-l-4 border-l-ink bg-surface px-4 py-3">
              <h3 className="text-xs font-semibold text-ink">
                Practice Attempts
              </h3>
              <p className="mt-1 text-xl font-bold text-ink">
                {student.practiceAttemptCount === undefined
                  ? "—"
                  : student.practiceAttemptCount}
              </p>
            </article>
          </li>
        </ul>

        <section className="mt-6 rounded-2xl border border-border-ui p-5">
          <header className="flex items-center justify-between gap-2">
            <h3 className="min-w-0 text-base font-bold text-ink">
              Performance by Cognitive Level
            </h3>
            <ExplainTip label="About this student cognitive chart">
              {explainCopy.studentCognitive}
            </ExplainTip>
          </header>
          {hasCognitiveLevels ? (
            <StudentCognitiveLevelChart
              cognitiveLevels={student.cognitiveLevels}
            />
          ) : (
            <p className="mt-3 text-sm text-text-secondary">
              Cognitive-level performance is not available yet for this student.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-coral/40 bg-coral/10 p-5">
          <h3 className="text-base font-bold text-coral">
            Trigger Interventions
          </h3>
          {hasInterventions ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-coral">
              {student.interventionLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-text-secondary">
              No open interventions.
            </p>
          )}
        </section>
      </article>
    </div>
  );
}
