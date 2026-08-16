"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStudentCourseDashboard } from "@/helpers/studentDashboardApi";
import type { StudentCourseDashboard } from "@/helpers/studentDashboardApi";
import { getCourse } from "@/helpers/coursesApi";
import { PAGE_SHELL_CLASS } from "@/helpers/pageLayout";
import { AttemptsTrendChart } from "./AttemptsTrendChart";
import { BreakdownTabs } from "./BreakdownTabs";
import { GrowthHighlights } from "./GrowthHighlights";
import { SummaryCards } from "./SummaryCards";

type StudentDashboardPageProps = {
  courseId: string;
  studentEmail: string;
};

function formatTime(seconds: number | undefined): string {
  if (seconds === undefined) return "—";
  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (minutes === 0) return `${secs}s`;
  return secs === 0 ? `${minutes}m` : `${minutes}m ${secs}s`;
}

function formatPercent(value: number | undefined): string {
  if (value === undefined) return "—";
  return `${Math.round(value)}%`;
}

function DashboardRecommendations({
  recommendations,
}: {
  recommendations: string[];
}) {
  if (recommendations.length === 0) return null;
  return (
    <section aria-labelledby="recommendations-heading">
      <h2
        id="recommendations-heading"
        className="text-xl font-bold tracking-tight text-ink"
      >
        Recommendations
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {recommendations.map((rec, i) => (
          <li
            key={i}
            className="flex gap-3 rounded-xl border border-border-ui bg-surface px-4 py-3 text-sm leading-relaxed text-ink"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral text-xs font-bold text-white"
            >
              {i + 1}
            </span>
            {rec}
          </li>
        ))}
      </ul>
    </section>
  );
}

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; data: StudentCourseDashboard; courseTitle: string };

export function StudentDashboardPage({
  courseId,
  studentEmail,
}: StudentDashboardPageProps) {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getStudentCourseDashboard(courseId),
      getCourse(courseId).then((c) => c?.title ?? "this course"),
    ])
      .then(([data, courseTitle]) => {
        if (cancelled) return;
        setState({ phase: "ready", data, courseTitle });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Could not load dashboard.";
        setState({ phase: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return (
    <section className={PAGE_SHELL_CLASS}>
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
          Practice dashboard
        </h1>
        {state.phase === "ready" && (
          <p className="mt-2 max-w-2xl text-base text-text-secondary">
            Performance for{" "}
            <span className="font-semibold text-ink">{studentEmail}</span> in{" "}
            <span className="font-semibold text-ink">{state.courseTitle}</span>.
          </p>
        )}
      </header>

      {state.phase === "loading" && (
        <p className="mt-10 text-sm text-text-secondary">Loading dashboard…</p>
      )}

      {state.phase === "error" && (
        <p className="mt-10 text-sm text-red-600">{state.message}</p>
      )}

      {state.phase === "ready" && (
        <DashboardContent courseId={courseId} data={state.data} />
      )}

      <footer className="mt-10 flex justify-end">
        <Link
          href={`/student/courses/${courseId}`}
          className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
        >
          Back to course
        </Link>
      </footer>
    </section>
  );
}

function DashboardContent({
  courseId,
  data,
}: {
  courseId: string;
  data: StudentCourseDashboard;
}) {
  const summaryCards = [
    {
      label: "Total quiz attempts",
      value: data.totalAttempts === 0 ? "0" : String(data.totalAttempts),
      sub:
        data.totalAttempts === 1 ? "1 quiz completed" : `${data.totalAttempts} quizzes completed`,
    },
    {
      label: "Quiz average",
      value: formatPercent(data.avgScorePercent),
      sub: data.avgScorePercent !== undefined ? "across all attempts" : "no attempts yet",
    },
    {
      label: "Avg time per quiz",
      value: formatTime(data.avgTimeSeconds),
      sub: data.avgTimeSeconds !== undefined ? "per completed quiz" : "no attempts yet",
    },
  ];

  const hasTrendData = data.totalAttempts >= 3;

  return (
    <section className="mt-8 flex flex-col gap-8">
      {/* Summary cards */}
      <SummaryCards cards={summaryCards} />

      {/* Trend chart */}
      <article className="rounded-2xl border border-border-ui bg-surface p-6 shadow-[0_8px_24px_rgba(30,27,51,0.06)] md:p-8">
        {hasTrendData ? (
          <AttemptsTrendChart
            trendAttempts={data.trendAttempts}
            overallAvgScorePercent={data.overallAvgScorePercent}
            totalAttempts={data.totalAttempts}
          />
        ) : (
          <section aria-label="Recent attempts">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              Recent attempts
            </h2>
            <p className="mt-4 text-sm text-text-secondary">
              Keep practising — your trend chart will appear once you have at
              least 3 completed quizzes.
            </p>
            <Link
              href={`/student/courses/${courseId}/quiz`}
              className="mt-4 inline-block rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              Start a quiz
            </Link>
          </section>
        )}
      </article>

      {/* Breakdown */}
      <article className="rounded-2xl border border-border-ui bg-surface p-6 shadow-[0_8px_24px_rgba(30,27,51,0.06)] md:p-8">
        <BreakdownTabs
          bloomBreakdown={data.bloomBreakdown}
          sectionBreakdown={data.sectionBreakdown}
          difficultyBreakdown={data.difficultyBreakdown}
        />
      </article>

      {/* Growth highlights */}
      {data.totalAttempts > 0 && (
        <article className="rounded-2xl border border-border-ui bg-surface p-6 shadow-[0_8px_24px_rgba(30,27,51,0.06)] md:p-8">
          <GrowthHighlights
            totalAttempts={data.totalAttempts}
            growthDeltaPercent={data.growthDeltaPercent}
            streakAboveTarget={data.streakAboveTarget}
            mostImprovedCategory={data.mostImprovedCategory}
            regressionFlag={data.regressionFlag}
            stalledFlag={data.stalledFlag}
            bestScorePercent={data.bestScorePercent}
            firstAttemptScorePercent={data.firstAttemptScorePercent}
            avgScorePercent={data.avgScorePercent}
          />
        </article>
      )}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <article className="rounded-2xl border border-border-ui bg-surface p-6 shadow-[0_8px_24px_rgba(30,27,51,0.06)] md:p-8">
          <DashboardRecommendations recommendations={data.recommendations} />
        </article>
      )}
    </section>
  );
}
