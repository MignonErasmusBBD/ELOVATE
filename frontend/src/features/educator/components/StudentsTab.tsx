"use client";

import { useState } from "react";
import type { EducatorStudentSummary } from "../types";
import { StudentDetailsModal } from "./StudentDetailsModal";

type StudentsTabProps = {
  students: EducatorStudentSummary[];
};

export function StudentsTab({ students }: StudentsTabProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<
    string | undefined
  >(undefined);
  const [resolvedStudentIds, setResolvedStudentIds] = useState<string[]>([]);

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId,
  );

  return (
    <section aria-labelledby="students-heading" className="mt-6">
      <h2
        id="students-heading"
        className="text-xl font-bold tracking-tight text-ink"
      >
        Student Progress Overview
      </h2>

      <ul className="mt-4 flex list-none flex-col gap-4 p-0">
        {students.map((student) => {
          const interventionsResolved = resolvedStudentIds.includes(
            student.id,
          );
          const showAttention =
            student.needsAttention && interventionsResolved === false;

          return (
            <li key={student.id}>
              <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <section>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
                      {student.fullName}
                      {showAttention ? (
                        <span
                          aria-label="Needs attention"
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white"
                        >
                          !
                        </span>
                      ) : undefined}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      Overall: {student.overallPercent}%
                    </p>
                  </section>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentId(student.id)}
                    className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                  >
                    View Details
                  </button>
                </header>

                <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <dt className="text-xs font-medium text-text-secondary">
                      Practice Quiz
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">
                      {student.practiceQuizPercent}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-text-secondary">
                      Practice Attempts
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-coral">
                      {student.practiceAttemptCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-text-secondary">
                      Time Spent
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">
                      {student.timeSpentLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-text-secondary">
                      Cheat Access
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-violet-700">
                      {student.cheatAccessCount}x
                    </dd>
                  </div>
                </dl>
              </article>
            </li>
          );
        })}
      </ul>

      {selectedStudent !== undefined ? (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => setSelectedStudentId(undefined)}
          onMarkInterventionsResolved={() => {
            setResolvedStudentIds((previousIds) => {
              if (previousIds.includes(selectedStudent.id)) {
                return previousIds;
              }
              return [...previousIds, selectedStudent.id];
            });
            setSelectedStudentId(undefined);
          }}
        />
      ) : undefined}
    </section>
  );
}
