"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  getEducatorCourseDashboard,
  getEducatorCourseOptions,
} from "../data/dashboard";
import type { EducatorCourseVisibility, EducatorTabId } from "../types";
import { AddCourseFormModal } from "./AddCourseFormModal";
import { CourseVisibilityToggle } from "./CourseVisibilityToggle";
import { EducatorCourseSelect } from "./EducatorCourseSelect";
import { EducatorMetricsRow } from "./EducatorMetricsRow";
import { EducatorTabNav } from "./EducatorTabNav";
import { LearningContentTab } from "./LearningContentTab";
import { OverviewTab } from "./OverviewTab";
import { QuestionsTab } from "./QuestionsTab";
import { StudentsTab } from "./StudentsTab";

export function EducatorDashboardPage() {
  const courseOptions = getEducatorCourseOptions();
  const defaultCourseId =
    courseOptions[0] === undefined ? "" : courseOptions[0].id;

  const [selectedCourseId, setSelectedCourseId] = useState(defaultCourseId);
  const [selectedTabId, setSelectedTabId] =
    useState<EducatorTabId>("overview");
  const [courseVisibilityFilter, setCourseVisibilityFilter] =
    useState<EducatorCourseVisibility>("private");
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);

  const dashboard = useMemo(
    () => getEducatorCourseDashboard(selectedCourseId),
    [selectedCourseId],
  );

  if (dashboard === undefined) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
        <p className="text-text-secondary">No educator courses available.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Educator dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-base text-text-secondary">
            Monitor practice performance, students, and questions for a selected
            course.
          </p>
        </div>
        <Button
          variant="compact"
          type="button"
          className="inline-flex shrink-0 items-center gap-2 self-start"
          onClick={() => setIsAddCourseModalOpen(true)}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add course
        </Button>
      </header>

      <section className="mt-8 flex flex-col gap-4">
        <CourseVisibilityToggle
          selectedVisibility={courseVisibilityFilter}
          onSelectVisibility={setCourseVisibilityFilter}
        />
        <EducatorCourseSelect
          courses={courseOptions}
          selectedCourseId={selectedCourseId}
          onSelectCourse={(courseId) => {
            setSelectedCourseId(courseId);
            setSelectedTabId("overview");
          }}
        />
      </section>

      <section className="mt-6">
        <EducatorMetricsRow
          totalStudents={dashboard.totalStudents}
          averagePracticeQuizPercent={dashboard.averagePracticeQuizPercent}
        />
      </section>

      <article className="mt-8 rounded-2xl border border-border-ui bg-surface p-4 shadow-[0_8px_24px_rgba(30,27,51,0.06)] md:p-6">
        <EducatorTabNav
          selectedTabId={selectedTabId}
          onSelectTab={setSelectedTabId}
        />

        {selectedTabId === "overview" ? (
          <OverviewTab dashboard={dashboard} />
        ) : undefined}
        {selectedTabId === "students" ? (
          <StudentsTab
            key={dashboard.courseId}
            students={dashboard.students}
          />
        ) : undefined}
        {selectedTabId === "questions" ? (
          <QuestionsTab
            key={dashboard.courseId}
            courseTitle={dashboard.courseTitle}
            questions={dashboard.questions}
          />
        ) : undefined}
        {selectedTabId === "learning-content" ? (
          <LearningContentTab
            key={dashboard.courseId}
            courseTitle={dashboard.courseTitle}
            learningContentSections={dashboard.learningContentSections}
          />
        ) : undefined}
      </article>

      {isAddCourseModalOpen ? (
        <AddCourseFormModal
          selectedVisibility={courseVisibilityFilter}
          onClose={() => setIsAddCourseModalOpen(false)}
          onSave={() => {
            setIsAddCourseModalOpen(false);
          }}
        />
      ) : undefined}
    </section>
  );
}
