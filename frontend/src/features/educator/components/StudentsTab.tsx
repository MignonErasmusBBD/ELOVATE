"use client";

import { useEffect, useState } from "react";
import { SearchField } from "@/components/ui/SearchField";
import { Spinner } from "@/components/ui/Spinner";
import { StatusPill } from "@/components/ui/StatusPill";
import { errorMessageFromUnknown } from "@/helpers/elovateApi";
import { itemsMatchingSearch } from "@/helpers/search";
import {
  formatEnrollmentDate,
  listCourseEnrollments,
  type ElovateEnrollment,
  type EnrollmentStatus,
} from "@/helpers/enrollmentsApi";
import type { EducatorStudentSummary } from "../types";
import { StudentDetailsModal } from "./StudentDetailsModal";

type StudentsTabProps = {
  courseId: string;
  courseTitle: string;
};

function statusPillTone(
  status: EnrollmentStatus,
): "success" | "muted" | "warning" {
  if (status === "active") {
    return "success";
  }
  if (status === "completed") {
    return "muted";
  }
  return "warning";
}

function statusLabel(status: EnrollmentStatus) {
  if (status === "active") {
    return "Active";
  }
  if (status === "completed") {
    return "Completed";
  }
  return "Withdrawn";
}

function toStudentSummary(enrollment: ElovateEnrollment): EducatorStudentSummary {
  return {
    id: enrollment.userId,
    enrollmentId: enrollment.id,
    userId: enrollment.userId,
    fullName: enrollment.userFullName,
    emailAddress: enrollment.emailAddress,
    status: enrollment.status,
    enrolledAtLabel: formatEnrollmentDate(enrollment.enrolledAt),
    needsAttention: false,
    practiceAttemptCount: enrollment.practiceAttemptCount,
    practiceQuizPercent: enrollment.practiceQuizPercent,
    cognitiveLevels: [],
    interventionLabels: [],
  };
}

export function StudentsTab({ courseId, courseTitle }: StudentsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<EducatorStudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | undefined>();
  const [selectedStudentId, setSelectedStudentId] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      setIsLoading(true);
      setLoadErrorMessage(undefined);
      try {
        const [activeEnrollments, completedEnrollments] = await Promise.all([
          listCourseEnrollments({ courseId, status: "active" }),
          listCourseEnrollments({ courseId, status: "completed" }),
        ]);
        if (cancelled) {
          return;
        }

        const nextStudents = [
          ...activeEnrollments,
          ...completedEnrollments,
        ].map(toStudentSummary);
        setStudents(nextStudents);
        setSelectedStudentId((currentId) => {
          if (
            currentId !== undefined &&
            nextStudents.some((student) => student.id === currentId)
          ) {
            return currentId;
          }
          return undefined;
        });
      } catch (error) {
        if (cancelled === false) {
          setStudents([]);
          setLoadErrorMessage(
            errorMessageFromUnknown(error, "Could not load enrolled students."),
          );
        }
      } finally {
        if (cancelled === false) {
          setIsLoading(false);
        }
      }
    }

    void loadStudents();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId,
  );
  const visibleStudents = itemsMatchingSearch(
    students,
    searchQuery,
    (student) => [student.fullName, student.emailAddress],
  );

  return (
    <section aria-labelledby="students-heading" className="mt-6">
      <header>
        <h2
          id="students-heading"
          className="text-xl font-bold tracking-tight text-ink"
        >
          Students for {courseTitle}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Enrolled learners on this course. Detailed quiz analytics will appear
          here as progress data becomes available.
        </p>
      </header>

      {students.length > 0 ? (
        <section className="mt-4">
          <SearchField
            id="students-search"
            label="Search students"
            placeholder="Search students"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </section>
      ) : undefined}

      {isLoading ? (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-text-secondary">
          <Spinner className="size-4" />
          Loading students…
        </p>
      ) : undefined}

      {loadErrorMessage === undefined ? undefined : (
        <p className="mt-4 text-sm text-coral" role="alert">
          {loadErrorMessage}
        </p>
      )}

      {isLoading === false &&
      loadErrorMessage === undefined &&
      students.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary" role="status">
          No students enrolled in this course yet.
        </p>
      ) : undefined}

      {students.length > 0 && visibleStudents.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          No students match your search.
        </p>
      ) : undefined}

      {visibleStudents.length === 0 ? undefined : (
        <ul className="mt-4 flex list-none flex-col gap-4 p-0">
          {visibleStudents.map((student) => (
            <li key={student.enrollmentId}>
              <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <section>
                    <h3 className="flex flex-wrap items-center gap-2 text-lg font-bold text-ink">
                      {student.fullName}
                      <StatusPill
                        label={statusLabel(student.status)}
                        tone={statusPillTone(student.status)}
                      />
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      {student.emailAddress}
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
                      Enrollment status
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">
                      {statusLabel(student.status)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-text-secondary">
                      Enrolled
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">
                      {student.enrolledAtLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-text-secondary">
                      Practice Quiz
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">
                      {student.practiceQuizPercent === undefined
                        ? "—"
                        : `${student.practiceQuizPercent}%`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-text-secondary">
                      Practice Attempts
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">
                      {student.practiceAttemptCount === undefined
                        ? "—"
                        : student.practiceAttemptCount}
                    </dd>
                  </div>
                </dl>
              </article>
            </li>
          ))}
        </ul>
      )}

      {selectedStudent === undefined ? undefined : (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => setSelectedStudentId(undefined)}
        />
      )}
    </section>
  );
}
