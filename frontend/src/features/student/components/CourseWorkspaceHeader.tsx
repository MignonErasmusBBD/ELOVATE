"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCourse, type ElovateCourseSummary } from "@/helpers/coursesApi";
import { WORKSPACE_BAR_CLASS } from "@/helpers/pageLayout";
import { CourseWorkspaceNav } from "./CourseWorkspaceNav";
import { useQuizProgress } from "./QuizProgressContext";

type CourseWorkspaceHeaderProps = {
  courseId: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "ok"; course: ElovateCourseSummary }
  | { status: "error" };

export function CourseWorkspaceHeader({ courseId }: CourseWorkspaceHeaderProps) {
  const { isQuizInProgress } = useQuizProgress();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    getCourse(courseId)
      .then((loaded) => {
        if (cancelled) return;
        if (loaded === undefined) {
          setState({ status: "error" });
        } else {
          setState({ status: "ok", course: loaded });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (state.status !== "ok") {
    return (
      <header className="border-b border-border-ui bg-surface">
        <section className={`${WORKSPACE_BAR_CLASS} flex-row items-center justify-between`}>
          <p className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Course workspace
          </p>
          <Link
            href="/courses"
            className="rounded-lg border border-border-ui bg-surface px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-page"
          >
            All courses
          </Link>
        </section>
      </header>
    );
  }

  return (
    <CourseWorkspaceNav
      courseId={courseId}
      courseTitle={state.course.title}
      hideQuizLinks={state.course.status === "deactivated"}
      lockNav={isQuizInProgress}
    />
  );
}
