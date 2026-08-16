"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExplainTip } from "@/components/ui/ExplainTip";
import { explainCopy } from "@/helpers/explainCopy";
import {
  enrollmentStatusLabel,
  type EnrollmentStatus,
} from "@/helpers/enrollmentStatus";
import { WORKSPACE_BAR_CLASS } from "@/helpers/pageLayout";

type CourseWorkspaceNavProps = {
  courseId: string;
  courseTitle: string;
  hideQuizLinks?: boolean;
  lockNav?: boolean;
  isRequired?: boolean;
  enrollmentStatus?: EnrollmentStatus;
};

function getCourseWorkspaceLinks(courseId: string) {
  const basePath = `/student/courses/${courseId}`;

  return [
    {
      id: "lesson",
      href: basePath,
      label: "Lesson",
      match: (pathname: string) => pathname === basePath,
    },
    {
      id: "quiz",
      href: `${basePath}/quiz`,
      label: "Practice Quiz",
      match: (pathname: string) => pathname.startsWith(`${basePath}/quiz`),
    },
    {
      id: "dashboard",
      href: `${basePath}/dashboard`,
      label: "Dashboard",
      match: (pathname: string) =>
        pathname.startsWith(`${basePath}/dashboard`),
    },
  ] as const;
}

export function CourseWorkspaceNav({
  courseId,
  courseTitle,
  hideQuizLinks = false,
  lockNav = false,
  isRequired = false,
  enrollmentStatus,
}: CourseWorkspaceNavProps) {
  const pathname = usePathname();
  const allLinks = getCourseWorkspaceLinks(courseId);
  const workspaceLinks = hideQuizLinks
    ? allLinks.filter((l) => l.id === "lesson")
    : allLinks;

  return (
    <header className="border-b border-border-ui bg-surface">
      <section className={WORKSPACE_BAR_CLASS}>
        <section className="flex flex-wrap items-center justify-between gap-3">
          <section className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Course workspace
            </p>
            <p className="mt-1 truncate text-xl font-bold tracking-tight text-ink md:text-2xl">
              {courseTitle}
            </p>
            {isRequired === false &&
            enrollmentStatus !== "completed" &&
            enrollmentStatus !== "overdue" ? undefined : (
              <p className="mt-2 flex flex-wrap items-center gap-2">
                {isRequired ? (
                  <span className="inline-flex items-center rounded-full border-2 border-red-500 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                    Required
                  </span>
                ) : undefined}
                {enrollmentStatus === "completed" ||
                enrollmentStatus === "overdue" ? (
                  <span
                    className={
                      enrollmentStatus === "completed"
                        ? "inline-flex items-center rounded-full border-2 border-emerald-500 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                        : "inline-flex items-center rounded-full border-2 border-red-500 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700"
                    }
                  >
                    {enrollmentStatusLabel(enrollmentStatus)}
                  </span>
                ) : undefined}
                <ExplainTip label="About required due dates">
                  {explainCopy.enrolmentDueOutcome}
                </ExplainTip>
              </p>
            )}
          </section>
          {lockNav ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              Quiz in progress
            </p>
          ) : (
            <Link
              href="/courses"
              className="rounded-lg border border-border-ui bg-surface px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-page"
            >
              All courses
            </Link>
          )}
        </section>

        <nav aria-label="Course sections" className="flex flex-wrap items-center gap-2">
          <ul className="flex list-none flex-wrap gap-2 p-0">
            {workspaceLinks.map((link) => {
              const isCurrent = link.match(pathname);

              if (lockNav) {
                return (
                  <li key={link.id}>
                    <span
                      aria-disabled="true"
                      className={
                        isCurrent
                          ? "inline-flex rounded-lg bg-ink/40 px-4 py-2 text-sm font-semibold text-white/70 cursor-not-allowed"
                          : "inline-flex rounded-lg border border-border-ui bg-surface/60 px-4 py-2 text-sm font-medium text-text-secondary/50 cursor-not-allowed"
                      }
                    >
                      {link.label}
                    </span>
                  </li>
                );
              }

              return (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={
                      isCurrent
                        ? "inline-flex rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
                        : "inline-flex rounded-lg border border-border-ui bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:bg-page"
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ExplainTip label="About the course workspace">
            Lesson is the reading material. Practice Quiz draws from the
            question bank. Dashboard shows your quiz trend, breakdown by
            skill and section, and growth highlights.
          </ExplainTip>
        </nav>
      </section>
    </header>
  );
}
