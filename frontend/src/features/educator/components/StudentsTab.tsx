"use client";

import { useEffect, useState } from "react";
import { SearchField } from "@/components/ui/SearchField";
import { Spinner } from "@/components/ui/Spinner";
import { StatusPill } from "@/components/ui/StatusPill";
import { ExplainTip } from "@/components/ui/ExplainTip";
import { ElovateApiError, errorMessageFromUnknown } from "@/helpers/elovateApi";
import { explainCopy } from "@/helpers/explainCopy";
import {
  enrollmentStatusLabel,
  enrollmentStatusTone,
  type EnrollmentStatus,
} from "@/helpers/enrollmentStatus";
import { itemsMatchingSearch } from "@/helpers/search";
import {
  formatEnrollmentDate,
  listCourseEnrollments,
  type ElovateEnrollment,
} from "@/helpers/enrollmentsApi";
import {
  getActiveMandatoryFlaggedUserIds,
  triggerMandatoryProgressFlags,
} from "@/helpers/studentDashboardApi";
import type { EducatorStudentSummary } from "../types";
import { StudentDetailsModal } from "./StudentDetailsModal";

type StudentsTabProps = {
  courseId: string;
  courseTitle: string;
};

type EnrollmentRequirementFilter = "all" | "mandatory" | "non-mandatory";

const enrollmentRequirementFilters: {
  id: EnrollmentRequirementFilter;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "mandatory", label: "Mandatory enrollment" },
  { id: "non-mandatory", label: "Non-mandatory enrollment" },
];

function statusPillTone(status: EnrollmentStatus) {
  return enrollmentStatusTone(status);
}

function statusLabel(status: EnrollmentStatus) {
  return enrollmentStatusLabel(status);
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
    needsAttention: enrollment.status === "overdue",
    practiceAttemptCount: enrollment.practiceAttemptCount,
    practiceQuizPercent: enrollment.practiceQuizPercent,
    isRequired: enrollment.isRequired,
    cognitiveLevels: [],
    interventionLabels: [],
  };
}

function matchesRequirementFilter(
  student: EducatorStudentSummary,
  filter: EnrollmentRequirementFilter,
) {
  if (filter === "all") {
    return true;
  }
  if (filter === "mandatory") {
    return student.isRequired;
  }
  return student.isRequired === false;
}

export function StudentsTab({ courseId, courseTitle }: StudentsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [requirementFilter, setRequirementFilter] =
    useState<EnrollmentRequirementFilter>("all");
  const [students, setStudents] = useState<EducatorStudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | undefined>();
  const [selectedStudentId, setSelectedStudentId] = useState<
    string | undefined
  >(undefined);
  const [isFlagging, setIsFlagging] = useState(false);
  const [flaggedUserIds, setFlaggedUserIds] = useState<ReadonlySet<string>>(new Set());
  const [checkDone, setCheckDone] = useState(false);
  const [flagError, setFlagError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      setIsLoading(true);
      setLoadErrorMessage(undefined);
      try {
        const [activeEnrollments, completedEnrollments, overdueEnrollments, flaggedIds] =
          await Promise.all([
            listCourseEnrollments({ courseId, status: "active" }),
            listCourseEnrollments({ courseId, status: "completed" }),
            listCourseEnrollments({ courseId, status: "overdue" }),
            getActiveMandatoryFlaggedUserIds(courseId),
          ]);
        if (cancelled) {
          return;
        }

        setFlaggedUserIds(new Set(flaggedIds));
        const nextStudents = [
          ...activeEnrollments,
          ...completedEnrollments,
          ...overdueEnrollments,
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

  async function handleRunMandatoryFlags() {
    setIsFlagging(true);
    setFlagError(undefined);
    try {
      const result = await triggerMandatoryProgressFlags(courseId);
      setFlaggedUserIds(new Set(result.activeFlaggedUserIds));
      setCheckDone(true);
    } catch (error) {
      if (error instanceof ElovateApiError) {
        if (error.statusCode === 403) {
          setFlagError("You don't have permission to run this check.");
        } else if (error.statusCode === 404) {
          setFlagError("This check is not available. Try refreshing the page.");
        } else {
          setFlagError("Could not run the mandatory progress check. Please try again.");
        }
      } else {
        setFlagError("Could not run the mandatory progress check. Please try again.");
      }
    } finally {
      setIsFlagging(false);
    }
  }

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId,
  );
  const requirementFilteredStudents = students.filter((student) =>
    matchesRequirementFilter(student, requirementFilter),
  );
  const visibleStudents = itemsMatchingSearch(
    requirementFilteredStudents,
    searchQuery,
    (student) => [student.fullName, student.emailAddress],
  );

  return (
    <section aria-labelledby="students-heading" className="mt-6">
      <header>
        <h2
          id="students-heading"
          className="flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight text-ink"
        >
          Students for {courseTitle}
          <ExplainTip label="About due dates and completion">
            {explainCopy.enrolmentDueOutcome}
          </ExplainTip>
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Enrolled learners on this course. Open a student for attempt trends,
          performance breakdown, and growth highlights.
        </p>
      </header>

      {students.length > 0 ? (
        <section className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <nav aria-label="Enrollment requirement filter">
              <ul className="flex list-none flex-wrap gap-2 p-0">
                {enrollmentRequirementFilters.map((filter) => {
                  const isSelected = filter.id === requirementFilter;
                  return (
                    <li key={filter.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setRequirementFilter(filter.id);
                          setFlagError(undefined);
                        }}
                        aria-current={isSelected ? "true" : undefined}
                        className={
                          isSelected
                            ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                            : "rounded-full border border-border-ui bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:bg-page"
                        }
                      >
                        {filter.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <SearchField
              id="students-search"
              label="Search students"
              placeholder="Search students"
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>

          {requirementFilter === "mandatory" && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => { void handleRunMandatoryFlags(); }}
                disabled={isFlagging}
                className="inline-flex items-center gap-2 rounded-lg border border-border-ui bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-page disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFlagging ? (
                  <>
                    <Spinner className="size-4" />
                    Checking progress…
                  </>
                ) : (
                  "Check mandatory progress"
                )}
              </button>

              {checkDone && flagError === undefined && (
                <p className="text-sm text-text-secondary">
                  Check complete:{" "}
                  {flaggedUserIds.size > 0 ? (
                    <span className="font-medium text-coral">
                      {flaggedUserIds.size} student{flaggedUserIds.size === 1 ? "" : "s"} flagged
                    </span>
                  ) : (
                    "all mandatory students are on track"
                  )}
                  .
                </p>
              )}

              {flagError !== undefined && (
                <p className="text-sm text-coral" role="alert">
                  {flagError}
                </p>
              )}
            </div>
          )}
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
          {requirementFilteredStudents.length === 0
            ? "No students match this enrollment filter."
            : "No students match your search."}
        </p>
      ) : undefined}

      {visibleStudents.length === 0 ? undefined : (
        <ul className="mt-4 flex list-none flex-col gap-4 p-0">
          {visibleStudents.map((student) => (
            <li key={student.enrollmentId}>
              <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <section>
                    <h3 className="text-lg font-bold text-ink">
                      {student.fullName}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <StatusPill
                        label={statusLabel(student.status)}
                        tone={statusPillTone(student.status)}
                      />
                      {student.isRequired && (
                        <span className="rounded-full bg-coral/10 px-2.5 py-0.5 text-xs font-semibold text-coral">
                          Mandatory
                        </span>
                      )}
                      {flaggedUserIds.has(student.userId) && (
                        <span className="rounded-full bg-coral/20 px-2.5 py-0.5 text-xs font-semibold text-coral">
                          Progress at risk
                        </span>
                      )}
                    </div>
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
          courseId={courseId}
          student={selectedStudent}
          onClose={() => setSelectedStudentId(undefined)}
        />
      )}
    </section>
  );
}