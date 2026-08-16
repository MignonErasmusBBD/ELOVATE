"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExplainTip } from "@/components/ui/ExplainTip";
import { Spinner } from "@/components/ui/Spinner";
import { useActionFeedback, useCurrentUser } from "@/features/platform";
import { listCourses, type ElovateCourseSummary } from "@/helpers/coursesApi";
import {
  parseEnrollmentStatus,
  type EnrollmentStatus,
} from "@/helpers/enrollmentStatus";
import { explainCopy } from "@/helpers/explainCopy";
import { PAGE_SHELL_CLASS } from "@/helpers/pageLayout";
import { itemsMatchingSearch } from "@/helpers/search";
import {
  listMyEnrollments,
  startCommunityEnrollment,
} from "@/helpers/enrollmentsApi";
import type { CourseFilter } from "../types";
import { CourseCard } from "./CourseCard";
import { CourseFilterBar } from "./CourseFilterBar";

function emptyCoursesMessage(
  selectedFilter: CourseFilter,
  searchQuery: string,
): string {
  if (searchQuery.trim() !== "") {
    return "No courses match your search.";
  }
  if (selectedFilter === "enrolled") {
    return "You haven't enrolled in any courses yet.";
  }
  return "No courses found.";
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold tracking-tight text-ink">{children}</h2>
  );
}

type EnrollmentRequirement = {
  isRequired: boolean;
  dueAt: string | undefined;
  enrollmentStatus: EnrollmentStatus | undefined;
};

function CourseGrid({
  courses,
  enrolledCourseIds,
  enrollmentRequirements,
  onEnrol,
}: {
  courses: ElovateCourseSummary[];
  enrolledCourseIds: Set<string>;
  enrollmentRequirements: Map<string, EnrollmentRequirement>;
  onEnrol: (courseId: string) => Promise<void>;
}) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => {
        const isEnrolled = enrolledCourseIds.has(course.id);
        const showEnrolButton =
          !isEnrolled && course.visibility === "community";
        const requirement = enrollmentRequirements.get(course.id);

        return (
          <li key={course.id} className="min-w-0">
            <Link href={`/student/courses/${course.id}`} className="block h-full min-w-0">
              <CourseCard
                id={course.id}
                title={course.title}
                description={course.description}
                visibility={course.visibility ?? "community"}
                status={course.status ?? "active"}
                isRequired={requirement?.isRequired === true}
                dueAt={requirement?.dueAt}
                enrollmentStatus={requirement?.enrollmentStatus}
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
  const { showSuccess, showError } = useActionFeedback();
  const hasOrg = profile?.organizationId !== undefined;
  const router = useRouter();

  const [selectedFilter, setSelectedFilter] = useState<CourseFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCourses, setActiveCourses] = useState<ElovateCourseSummary[]>([]);
  const [archivedCourses, setArchivedCourses] = useState<ElovateCourseSummary[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [enrollmentRequirements, setEnrollmentRequirements] = useState<
    Map<string, EnrollmentRequirement>
  >(new Map());
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
        const courses = await listCourses({ status: "all" });
        const listIncludesEnrollment = courses.every(
          (course) => course.isEnrolled !== undefined,
        );
        const enrollments = listIncludesEnrollment
          ? []
          : await listMyEnrollments();

        if (cancelled) return;
        setActiveCourses(
          courses.filter((course) => course.status !== "deactivated" && course.status !== "draft"),
        );
        setArchivedCourses(
          courses.filter((course) => course.status === "deactivated"),
        );

        const nextEnrolledIds = new Set<string>();
        const nextRequirements = new Map<string, EnrollmentRequirement>();
        if (listIncludesEnrollment) {
          for (const course of courses) {
            if (course.isEnrolled === true) {
              nextEnrolledIds.add(course.id);
              nextRequirements.set(course.id, {
                isRequired: course.isRequired === true,
                dueAt: course.dueAt,
                enrollmentStatus: course.enrollmentStatus,
              });
            }
          }
        } else {
          for (const enrollment of enrollments) {
            const enrollmentStatus = parseEnrollmentStatus(enrollment.status);
            if (enrollmentStatus === "withdrawn") {
              continue;
            }
            nextEnrolledIds.add(enrollment.courseId);
            nextRequirements.set(enrollment.courseId, {
              isRequired: enrollment.isRequired,
              dueAt: enrollment.dueAt,
              enrollmentStatus,
            });
          }
        }
        setEnrolledCourseIds(nextEnrolledIds);
        setEnrollmentRequirements(nextRequirements);
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
    try {
      await startCommunityEnrollment(courseId);
      setEnrolledCourseIds((prev) => new Set([...prev, courseId]));
      showSuccess(
        "You are enrolled. You can open the lesson, take the practice quiz, and come back later — your progress stays on this account.",
      );
      router.push(`/student/courses/${courseId}`);
    } catch {
      showError("Could not enrol in that course.");
    }
  }

  const allCourses = [
    ...activeCourses,
    ...archivedCourses.filter((c) => enrolledCourseIds.has(c.id)),
  ];

  const filteredCourses = itemsMatchingSearch(
    allCourses.filter((course) => {
      if (selectedFilter === "community") {
        return course.visibility === "community";
      }
      if (selectedFilter === "organisation") {
        return course.visibility === "private";
      }
      if (selectedFilter === "enrolled") {
        return enrolledCourseIds.has(course.id);
      }
      return true;
    }),
    searchQuery,
    (course) => {
      if (course.description === undefined) {
        return [course.title];
      }
      return [course.title, course.description];
    },
  );

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
    <section className={PAGE_SHELL_CLASS}>
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-ink md:text-4xl">
          All Courses
          <ExplainTip label="About the course catalogue">
            {explainCopy.coursesCatalogue}
          </ExplainTip>
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
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      </div>

      {isLoading && (
        <p className="mt-10 inline-flex items-center gap-2 text-sm text-text-secondary">
          <Spinner className="size-4" />
          Loading courses…
        </p>
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
                      enrollmentRequirements={enrollmentRequirements}
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
                      enrollmentRequirements={enrollmentRequirements}
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
                      enrollmentRequirements={enrollmentRequirements}
                      onEnrol={handleEnrol}
                    />
                  </div>
                </section>
              )}

              {splitIsEmpty && (
                <p className="text-sm text-text-secondary">
                  {emptyCoursesMessage(selectedFilter, searchQuery)}
                </p>
              )}
            </div>
          )}

          {/* Flat list for Organisation / My courses filters */}
          {useSplit === false && (
            <div className="mt-10">
              {singleListCourses.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  {emptyCoursesMessage(selectedFilter, searchQuery)}
                </p>
              ) : (
                <CourseGrid
                  courses={singleListCourses}
                  enrolledCourseIds={enrolledCourseIds}
                  enrollmentRequirements={enrollmentRequirements}
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
