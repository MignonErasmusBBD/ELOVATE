"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/platform";
import { listCourses, type ElovateCourseSummary } from "@/helpers/coursesApi";
import {
  listMyEnrollments,
  startCommunityEnrollment,
} from "@/helpers/enrollmentsApi";
import type { CourseFilter } from "../types";
import { CourseCard } from "./CourseCard";
import { CourseFilterBar } from "./CourseFilterBar";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold tracking-tight text-ink">{children}</h2>
  );
}

function CourseGrid({
  courses,
  enrolledCourseIds,
  onEnrol,
}: {
  courses: ElovateCourseSummary[];
  enrolledCourseIds: Set<string>;
  onEnrol: (courseId: string) => Promise<void>;
}) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => {
        const isEnrolled = enrolledCourseIds.has(course.id);
        const showEnrolButton =
          !isEnrolled && course.visibility === "community";

        return (
          <li key={course.id}>
            <Link href={`/student/courses/${course.id}`} className="block h-full">
              <CourseCard
                id={course.id}
                title={course.title}
                description={course.description}
                visibility={course.visibility ?? "community"}
                status={course.status ?? "active"}
                onEnrol={
                  showEnrolButton
                    ? () => onEnrol(course.id)
                    : undefined
                }
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function CoursesPage() {
  const { profile, isLoading: isProfileLoading } = useCurrentUser();
  const hasOrg = profile?.organizationId !== undefined;
  const router = useRouter();

  const [selectedFilter, setSelectedFilter] = useState<CourseFilter>("all");
  const [activeCourses, setActiveCourses] = useState<ElovateCourseSummary[]>([]);
  const [archivedCourses, setArchivedCourses] = useState<ElovateCourseSummary[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
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
        const [active, archived, enrollments] = await Promise.all([
          listCourses(),
          listCourses({ status: "deactivated" }),
          listMyEnrollments("active"),
        ]);

        if (cancelled) return;
        setActiveCourses(active);
        setArchivedCourses(archived);
        setEnrolledCourseIds(new Set(enrollments.map((e) => e.courseId)));
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

  async function handleEnrol(courseId: string) {
    await startCommunityEnrollment(courseId);
    setEnrolledCourseIds((prev) => new Set([...prev, courseId]));
    router.push(`/student/courses/${courseId}`);
  }

  const allCourses = [
    ...activeCourses,
    ...archivedCourses.filter((c) => enrolledCourseIds.has(c.id)),
  ];

  // Courses matching the active filter
  const filteredCourses = allCourses.filter((course) => {
    if (selectedFilter === "community") return course.visibility === "community";
    if (selectedFilter === "organisation") return course.visibility === "private";
    if (selectedFilter === "enrolled") return enrolledCourseIds.has(course.id);
    return true;
  });

  // Split view for "all" and "community" filters
  const useSplit =
    selectedFilter === "all" || selectedFilter === "community";

  // Section 1 — courses the user is actively enrolled in (any visibility)
  const enrolledSection = useSplit
    ? filteredCourses.filter((c) => enrolledCourseIds.has(c.id))
    : [];

  // Section 2 — private org courses accessible via role, but not enrolled in
  // Only relevant in "all" view (community filter hides private courses anyway)
  const orgSection =
    useSplit && selectedFilter === "all"
      ? filteredCourses.filter(
          (c) => c.visibility === "private" && !enrolledCourseIds.has(c.id),
        )
      : [];

  // Section 3 — unenrolled community courses to discover
  const exploreSection = useSplit
    ? filteredCourses.filter(
        (c) => c.visibility === "community" && !enrolledCourseIds.has(c.id),
      )
    : [];

  const splitIsEmpty =
    enrolledSection.length === 0 &&
    orgSection.length === 0 &&
    exploreSection.length === 0;

  // Single flat list for "organisation" and "enrolled" filters
  const singleListCourses = useSplit ? [] : filteredCourses;

  const isLoading =
    isProfileLoading || profile === undefined || isCoursesLoading;

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

      <div className="mt-8">
        <CourseFilterBar
          selected={selectedFilter}
          hasOrg={hasOrg}
          onSelect={setSelectedFilter}
        />
      </div>

      {isLoading && (
        <p className="mt-10 text-sm text-text-secondary">Loading courses…</p>
      )}

      {isLoading === false && errorMessage !== undefined && (
        <p className="mt-10 text-sm text-coral">{errorMessage}</p>
      )}

      {isLoading === false && errorMessage === undefined && (
        <>
          {/* Split view */}
          {useSplit && (
            <div className="mt-10 flex flex-col gap-12">
              {enrolledSection.length > 0 && (
                <section>
                  <SectionHeading>My enrolled courses</SectionHeading>
                  <div className="mt-6">
                    <CourseGrid
                      courses={enrolledSection}
                      enrolledCourseIds={enrolledCourseIds}
                      onEnrol={handleEnrol}
                    />
                  </div>
                </section>
              )}

              {orgSection.length > 0 && (
                <section>
                  <SectionHeading>Organisation courses</SectionHeading>
                  <p className="mt-1 text-sm text-text-secondary">
                    Courses you can access through your organisation role.
                  </p>
                  <div className="mt-6">
                    <CourseGrid
                      courses={orgSection}
                      enrolledCourseIds={enrolledCourseIds}
                      onEnrol={handleEnrol}
                    />
                  </div>
                </section>
              )}

              {exploreSection.length > 0 && (
                <section>
                  <SectionHeading>Explore</SectionHeading>
                  <p className="mt-1 text-sm text-text-secondary">
                    Community courses you haven't enrolled in yet.
                  </p>
                  <div className="mt-6">
                    <CourseGrid
                      courses={exploreSection}
                      enrolledCourseIds={enrolledCourseIds}
                      onEnrol={handleEnrol}
                    />
                  </div>
                </section>
              )}

              {splitIsEmpty && (
                <p className="text-sm text-text-secondary">No courses found.</p>
              )}
            </div>
          )}

          {/* Flat list for Organisation / My courses filters */}
          {useSplit === false && (
            <div className="mt-10">
              {singleListCourses.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  {selectedFilter === "enrolled"
                    ? "You haven't enrolled in any courses yet."
                    : "No courses found."}
                </p>
              ) : (
                <CourseGrid
                  courses={singleListCourses}
                  enrolledCourseIds={enrolledCourseIds}
                  onEnrol={handleEnrol}
                />
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
