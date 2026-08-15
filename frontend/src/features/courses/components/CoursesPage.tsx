"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/features/platform";
import { listCourses, type ElovateCourseSummary } from "@/helpers/coursesApi";
import type { CourseFilter } from "../types";
import { CourseCard } from "./CourseCard";
import { CourseFilterBar } from "./CourseFilterBar";

export function CoursesPage() {
  const { profile, isLoading: isProfileLoading } = useCurrentUser();
  const hasOrg = profile?.organizationId !== undefined;

  const [selectedFilter, setSelectedFilter] = useState<CourseFilter>("all");
  const [activeCourses, setActiveCourses] = useState<ElovateCourseSummary[]>(
    [],
  );
  const [archivedCourses, setArchivedCourses] = useState<
    ElovateCourseSummary[]
  >([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    if (isProfileLoading || profile === undefined) {
      return;
    }

    let cancelled = false;

    async function load() {
      setIsCoursesLoading(true);
      setErrorMessage(undefined);

      try {
        const [active, archived] = await Promise.all([
          listCourses(),
          listCourses({ status: "deactivated" }),
        ]);

        if (cancelled) {
          return;
        }
        setActiveCourses(active);
        setArchivedCourses(archived);
      } catch {
        if (cancelled === false) {
          setErrorMessage("Could not load courses.");
        }
      } finally {
        if (cancelled === false) {
          setIsCoursesLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [isProfileLoading, profile]);

  const allCourses = [...activeCourses, ...archivedCourses];

  const visibleCourses = allCourses.filter((course) => {
    if (selectedFilter === "community") {
      return course.visibility === "community";
    }
    if (selectedFilter === "organisation") {
      return course.visibility === "private";
    }
    return true;
  });

  const isLoading = isProfileLoading || profile === undefined || isCoursesLoading;

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
          All Courses
        </h1>
        <p className="mt-2 max-w-2xl text-base text-text-secondary">
          Browse our catalog of courses. Click on a course to explore its
          learning units.
        </p>
      </header>

      {hasOrg && (
        <div className="mt-8">
          <CourseFilterBar
            selected={selectedFilter}
            onSelect={setSelectedFilter}
          />
        </div>
      )}

      {isLoading && (
        <p className="mt-10 text-sm text-text-secondary">Loading courses…</p>
      )}

      {isLoading === false && errorMessage !== undefined && (
        <p className="mt-10 text-sm text-coral">{errorMessage}</p>
      )}

      {isLoading === false && errorMessage === undefined && (
        <>
          {visibleCourses.length === 0 ? (
            <p className="mt-10 text-sm text-text-secondary">
              No courses found.
            </p>
          ) : (
            <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visibleCourses.map((course) => (
                <li key={course.id}>
                  <Link
                    href={`/student/courses/${course.id}`}
                    className="block h-full"
                  >
                    <CourseCard
                      id={course.id}
                      title={course.title}
                      description={course.description}
                      visibility={course.visibility ?? "community"}
                      status={course.status ?? "active"}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
