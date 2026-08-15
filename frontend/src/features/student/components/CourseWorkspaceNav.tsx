"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type CourseWorkspaceNavProps = {
  courseId: string;
  courseTitle: string;
  hideQuizLinks?: boolean;
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
}: CourseWorkspaceNavProps) {
  const pathname = usePathname();
  const allLinks = getCourseWorkspaceLinks(courseId);
  const workspaceLinks = hideQuizLinks
    ? allLinks.filter((l) => l.id === "lesson")
    : allLinks;

  return (
    <header className="border-b border-border-ui bg-surface">
      <section className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:px-10">
        <section className="flex flex-wrap items-center justify-between gap-3">
          <section className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Course workspace
            </p>
            <p className="mt-1 truncate text-xl font-bold tracking-tight text-ink md:text-2xl">
              {courseTitle}
            </p>
          </section>
          <Link
            href="/courses"
            className="rounded-lg border border-border-ui bg-surface px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-page"
          >
            All courses
          </Link>
        </section>

        <nav aria-label="Course sections">
          <ul className="flex list-none flex-wrap gap-2 p-0">
            {workspaceLinks.map((link) => {
              const isCurrent = link.match(pathname);

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
        </nav>
      </section>
    </header>
  );
}
