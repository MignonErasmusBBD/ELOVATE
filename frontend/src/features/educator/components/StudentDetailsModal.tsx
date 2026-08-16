"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { StatusPill } from "@/components/ui/StatusPill";
import { errorMessageFromUnknown } from "@/helpers/elovateApi";
import {
  getEducatorStudentCourseDashboard,
  type StudentCourseDashboard,
} from "@/helpers/studentDashboardApi";
import { AttemptsTrendChart } from "@/features/student/components/AttemptsTrendChart";
import { BreakdownTabs } from "@/features/student/components/BreakdownTabs";
import { GrowthHighlights } from "@/features/student/components/GrowthHighlights";
import { RecommendationCards } from "@/features/student/components/RecommendationCards";
import type { EducatorStudentSummary } from "../types";
import { ExplainTip } from "@/components/ui/ExplainTip";
import { explainCopy } from "@/helpers/explainCopy";
import { StudentCognitiveLevelChart } from "./StudentCognitiveLevelChart";

type StudentDetailsModalProps = {
  courseId: string;
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
  courseId,
  student,
  onClose,
}: StudentDetailsModalProps) {
  const [dashboard, setDashboard] = useState<
    StudentCourseDashboard | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | undefined>(
    undefined,
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

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setIsLoading(true);
      setLoadErrorMessage(undefined);
      setDashboard(undefined);
      try {
        const nextDashboard = await getEducatorStudentCourseDashboard(
          courseId,
          student.userId,
        );
        if (cancelled === false) {
          setDashboard(nextDashboard);
        }
      } catch (error) {
        if (cancelled === false) {
          setLoadErrorMessage(
            errorMessageFromUnknown(
              error,
              "Could not load this learner's practice insights.",
            ),
          );
        }
      } finally {
        if (cancelled === false) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [courseId, student.userId]);

  const practicePercent =
    dashboard?.avgScorePercent !== undefined
      ? Math.round(dashboard.avgScorePercent)
      : student.practiceQuizPercent;
  const practiceAttempts =
    dashboard?.totalAttempts !== undefined
      ? dashboard.totalAttempts
      : student.practiceAttemptCount;

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
                {practicePercent === undefined ? "—" : `${practicePercent}%`}
              </p>
            </article>
          </li>
          <li>
            <article className="rounded-xl border border-border-ui border-l-4 border-l-ink bg-surface px-4 py-3">
              <h3 className="text-xs font-semibold text-ink">
                Practice Attempts
              </h3>
              <p className="mt-1 text-xl font-bold text-ink">
                {practiceAttempts === undefined ? "—" : practiceAttempts}
              </p>
            </article>
          </li>
        </ul>

        {isLoading ? (
          <p className="mt-8 flex items-center gap-3 text-sm text-text-secondary">
            <Spinner />
            Loading practice insights…
          </p>
        ) : undefined}

        {loadErrorMessage !== undefined ? (
          <p className="mt-8 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
            {loadErrorMessage}
          </p>
        ) : undefined}

        {dashboard !== undefined ? (
          <section className="mt-8 flex flex-col gap-6">
            <article className="rounded-2xl border border-border-ui bg-surface p-5 md:p-6">
              <AttemptsTrendChart
                trendAttempts={dashboard.trendAttempts}
                overallAvgScorePercent={dashboard.overallAvgScorePercent}
                totalAttempts={dashboard.totalAttempts}
                viewerRole="educator"
              />
            </article>

            {dashboard.recommendations
              .filter((r) => r.flagType === "mandatory_at_risk")
              .map((r) => (
                <article
                  key={r.id}
                  className="rounded-2xl border border-coral/30 bg-coral/5 p-5 md:p-6"
                >
                  <header className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral/15 text-coral">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </span>
                    <span className="text-sm font-semibold text-coral">
                      Mandatory course — progress at risk
                    </span>
                  </header>
                  <p className="mt-3 text-sm leading-relaxed text-ink">
                    {r.sentence}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                    {r.evidence}
                  </p>
                </article>
              ))}

            {dashboard.recommendations.filter(
              (r) => r.flagType !== "mandatory_at_risk",
            ).length > 0 && (
              <article className="rounded-2xl border border-border-ui bg-surface p-5 md:p-6">
                <RecommendationCards
                  recommendations={dashboard.recommendations.filter(
                    (r) => r.flagType !== "mandatory_at_risk",
                  )}
                  courseId={courseId}
                  showLinks={false}
                  viewerRole="educator"
                />
              </article>
            )}

            <article className="rounded-2xl border border-border-ui bg-surface p-5 md:p-6">
              <BreakdownTabs
                bloomBreakdown={dashboard.bloomBreakdown}
                sectionBreakdown={dashboard.sectionBreakdown}
                difficultyBreakdown={dashboard.difficultyBreakdown}
                viewerRole="educator"
              />
            </article>

            {dashboard.totalAttempts > 0 ? (
              <article className="rounded-2xl border border-border-ui bg-surface p-5 md:p-6">
                <GrowthHighlights
                  totalAttempts={dashboard.totalAttempts}
                  growthDeltaPercent={dashboard.growthDeltaPercent}
                  streakAboveTarget={dashboard.streakAboveTarget}
                  mostImprovedCategory={dashboard.mostImprovedCategory}
                  regressionFlag={dashboard.regressionFlag}
                  stalledFlag={dashboard.stalledFlag}
                  bestScorePercent={dashboard.bestScorePercent}
                  firstAttemptScorePercent={dashboard.firstAttemptScorePercent}
                  avgScorePercent={dashboard.avgScorePercent}
                  viewerRole="educator"
                />
              </article>
            ) : undefined}
          </section>
        ) : undefined}

      </article>
    </div>
  );
}