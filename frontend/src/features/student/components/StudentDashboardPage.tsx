import Link from "next/link";
import type { StudentDashboardSummary } from "../types";
import { BackToLessonLink } from "./BackToLessonLink";
import { CognitiveLevelChart } from "./CognitiveLevelChart";
import { DashboardMetricsRow } from "./DashboardMetricsRow";
import { DashboardRecommendations } from "./DashboardRecommendations";
import { DashboardStatusBannerCard } from "./DashboardStatusBannerCard";
import { PracticeQuizProgressChart } from "./PracticeQuizProgressChart";

type StudentDashboardPageProps = {
  dashboardSummary: StudentDashboardSummary;
};

export function StudentDashboardPage({
  dashboardSummary,
}: StudentDashboardPageProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <section className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {dashboardSummary.courseTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-text-secondary">
            Practice-quiz dashboard for{" "}
            <span className="font-semibold text-ink">
              {dashboardSummary.studentEmailAddress}
            </span>
            .
          </p>
        </section>
        <BackToLessonLink courseId={dashboardSummary.courseId} />
      </header>

      <section
        aria-label="Status examples"
        className="mt-8 flex flex-col gap-3"
      >
        {dashboardSummary.statusBanners.map((banner) => (
          <DashboardStatusBannerCard
            key={banner.variant}
            banner={banner}
          />
        ))}
      </section>

      <section aria-label="Key metrics" className="mt-8">
        <DashboardMetricsRow metrics={dashboardSummary.metrics} />
      </section>

      <article className="mt-8 rounded-2xl border border-border-ui bg-surface p-6 shadow-[0_8px_24px_rgba(30,27,51,0.06)] md:p-8">
        <PracticeQuizProgressChart
          practiceQuizAttempts={dashboardSummary.practiceQuizAttempts}
        />
      </article>

      <article className="mt-8 rounded-2xl border border-border-ui bg-surface p-6 shadow-[0_8px_24px_rgba(30,27,51,0.06)] md:p-8">
        <header>
          <h2 className="text-xl font-bold tracking-tight text-ink">
            Performance by Cognitive Level
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Results across practice quizzes for this course.
          </p>
        </header>
        <CognitiveLevelChart
          cognitiveLevelPerformance={
            dashboardSummary.cognitiveLevelPerformance
          }
        />
        <section className="mt-6">
          <DashboardRecommendations
            recommendations={dashboardSummary.recommendations}
          />
        </section>
      </article>

      <footer className="mt-8 flex justify-end">
        <Link
          href={`/student/courses/${dashboardSummary.courseId}`}
          className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
        >
          Continue
        </Link>
      </footer>
    </section>
  );
}
