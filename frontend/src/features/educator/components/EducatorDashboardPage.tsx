"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/features/platform";
import {
  createCourse,
  listCourses,
  type ElovateCourseStatus,
} from "@/helpers/coursesApi";
import {
  EDUCATOR_PAGE_ROLES,
  userHasAnyRole,
} from "@/helpers/currentUserProfile";
import { errorMessageFromUnknown } from "@/helpers/elovateApi";
import {
  getEducatorCourseOverview,
  type EducatorCourseOverview,
} from "@/helpers/educatorOverviewApi";
import type { EducatorCourseVisibility, EducatorTabId } from "../types";
import {
  AddCourseFormModal,
  type AddCourseFormValues,
} from "./AddCourseFormModal";
import { CourseVisibilityToggle } from "./CourseVisibilityToggle";
import { EducatorCourseSelect } from "./EducatorCourseSelect";
import { EducatorMetricsRow } from "./EducatorMetricsRow";
import { EducatorTabNav } from "./EducatorTabNav";
import { LearningContentTab } from "./LearningContentTab";
import { OverviewTab } from "./OverviewTab";
import { QuestionsTab } from "./QuestionsTab";
import { StudentsTab } from "./StudentsTab";

type EducatorCourseOption = {
  id: string;
  title: string;
  status: ElovateCourseStatus;
};

export function EducatorDashboardPage() {
  const router = useRouter();
  const { profile, isLoading: isProfileLoading } = useCurrentUser();
  const pendingSelectedCourseIdRef = useRef<string | undefined>(undefined);

  const canAccessEducatorPage =
    profile === undefined
      ? false
      : userHasAnyRole(profile.roles, [...EDUCATOR_PAGE_ROLES]);
  const hasEducatorRole =
    profile === undefined ? false : profile.roles.includes("educator");
  const hasCommunityAdminRole =
    profile === undefined
      ? false
      : profile.roles.includes("community_admin");
  const canToggleCourseVisibility =
    hasEducatorRole && hasCommunityAdminRole;

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedTabId, setSelectedTabId] =
    useState<EducatorTabId>("overview");
  const [courseVisibilityFilter, setCourseVisibilityFilter] =
    useState<EducatorCourseVisibility>("private");
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [courseOptions, setCourseOptions] = useState<EducatorCourseOption[]>(
    [],
  );
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);
  const [coursesErrorMessage, setCoursesErrorMessage] = useState<
    string | undefined
  >();
  const [coursesReloadToken, setCoursesReloadToken] = useState(0);
  const [courseOverview, setCourseOverview] = useState<
    EducatorCourseOverview | undefined
  >(undefined);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);
  const [overviewErrorMessage, setOverviewErrorMessage] = useState<
    string | undefined
  >();
  const [overviewReloadToken, setOverviewReloadToken] = useState(0);

  const canCreateCourse =
    courseVisibilityFilter === "community" ||
    profile?.organizationId !== undefined;

  useEffect(() => {
    if (isProfileLoading) {
      return;
    }
    if (profile === undefined) {
      return;
    }
    if (canAccessEducatorPage === false) {
      router.replace("/courses");
    }
  }, [canAccessEducatorPage, isProfileLoading, profile, router]);

  useEffect(() => {
    if (canToggleCourseVisibility) {
      return;
    }
    if (hasCommunityAdminRole && hasEducatorRole === false) {
      setCourseVisibilityFilter("community");
      return;
    }
    setCourseVisibilityFilter("private");
  }, [canToggleCourseVisibility, hasCommunityAdminRole, hasEducatorRole]);

  useEffect(() => {
    if (isProfileLoading || profile === undefined) {
      return;
    }
    if (canAccessEducatorPage === false) {
      return;
    }

    const organizationId = profile.organizationId;
    if (
      courseVisibilityFilter === "private" &&
      organizationId === undefined
    ) {
      setCourseOptions([]);
      setSelectedCourseId("");
      setCoursesErrorMessage(
        "You need an organisation membership to manage organisation courses.",
      );
      setIsCoursesLoading(false);
      return;
    }

    let cancelled = false;

    async function loadCourses() {
      setIsCoursesLoading(true);
      setCoursesErrorMessage(undefined);

      try {
        const listInput = {
          visibility: courseVisibilityFilter,
          organizationId:
            courseVisibilityFilter === "private" ? organizationId : undefined,
        };

        const settledCourseLists = await Promise.allSettled([
          listCourses({ ...listInput, status: "active" }),
          listCourses({ ...listInput, status: "deactivated" }),
        ]);
        if (cancelled) {
          return;
        }

        const activeCourses =
          settledCourseLists[0].status === "fulfilled"
            ? settledCourseLists[0].value
            : [];
        const deactivatedCourses =
          settledCourseLists[1].status === "fulfilled"
            ? settledCourseLists[1].value
            : [];

        if (
          settledCourseLists[0].status === "rejected" &&
          settledCourseLists[1].status === "rejected"
        ) {
          setCourseOptions([]);
          setSelectedCourseId("");
          setCoursesErrorMessage("Could not load courses.");
          return;
        }

        const nextOptions = [
          ...activeCourses.map((course) => ({
            id: course.id,
            title: course.title,
            status: "active" as const,
          })),
          ...deactivatedCourses.map((course) => ({
            id: course.id,
            title: course.title,
            status: "deactivated" as const,
          })),
        ];
        setCourseOptions(nextOptions);
        setSelectedCourseId((currentCourseId) => {
          const pendingSelectedCourseId = pendingSelectedCourseIdRef.current;
          if (pendingSelectedCourseId !== undefined) {
            const pendingStillExists = nextOptions.some(
              (course) => course.id === pendingSelectedCourseId,
            );
            if (pendingStillExists) {
              pendingSelectedCourseIdRef.current = undefined;
              return pendingSelectedCourseId;
            }
          }
          const stillSelected = nextOptions.some(
            (course) => course.id === currentCourseId,
          );
          if (stillSelected) {
            return currentCourseId;
          }
          return nextOptions[0] === undefined ? "" : nextOptions[0].id;
        });
        setSelectedTabId("overview");
      } catch {
        if (cancelled === false) {
          setCourseOptions([]);
          setSelectedCourseId("");
          setCoursesErrorMessage("Could not load courses.");
        }
      } finally {
        if (cancelled === false) {
          setIsCoursesLoading(false);
        }
      }
    }

    void loadCourses();

    return () => {
      cancelled = true;
    };
  }, [
    canAccessEducatorPage,
    courseVisibilityFilter,
    coursesReloadToken,
    isProfileLoading,
    profile,
  ]);

  useEffect(() => {
    if (selectedCourseId === "") {
      setCourseOverview(undefined);
      setOverviewErrorMessage(undefined);
      setIsOverviewLoading(false);
      return;
    }

    let cancelled = false;

    async function loadOverview() {
      setIsOverviewLoading(true);
      setOverviewErrorMessage(undefined);
      try {
        const overview = await getEducatorCourseOverview(selectedCourseId);
        if (cancelled === false) {
          setCourseOverview(overview);
        }
      } catch (error) {
        if (cancelled === false) {
          setCourseOverview(undefined);
          setOverviewErrorMessage(
            errorMessageFromUnknown(error, "Could not load course overview."),
          );
        }
      } finally {
        if (cancelled === false) {
          setIsOverviewLoading(false);
        }
      }
    }

    void loadOverview();
    return () => {
      cancelled = true;
    };
  }, [overviewReloadToken, selectedCourseId]);

  function handleSelectTab(tabId: EducatorTabId) {
    setSelectedTabId(tabId);
    if (tabId === "overview" && selectedCourseId !== "") {
      setOverviewReloadToken((currentToken) => currentToken + 1);
    }
  }

  async function handleCreateCourse(formValues: AddCourseFormValues) {
    const createVisibility = canToggleCourseVisibility
      ? formValues.visibility
      : hasCommunityAdminRole
        ? "community"
        : "private";

    if (
      createVisibility === "private" &&
      (profile === undefined || profile.organizationId === undefined)
    ) {
      throw new Error(
        "You need an organisation membership to manage organisation courses.",
      );
    }

    if (
      createVisibility === "private" &&
      hasEducatorRole === false
    ) {
      throw new Error("Only educators can create organisation courses.");
    }

    if (
      createVisibility === "community" &&
      hasCommunityAdminRole === false
    ) {
      throw new Error("Only community admins can create community courses.");
    }

    const createdCourse = await createCourse({
      title: formValues.courseTitle,
      description:
        formValues.courseDescription === ""
          ? undefined
          : formValues.courseDescription,
      visibility: createVisibility,
      organizationId: profile?.organizationId,
    });

    pendingSelectedCourseIdRef.current = createdCourse.id;
    setCourseVisibilityFilter(createVisibility);
    setCoursesReloadToken((currentToken) => currentToken + 1);
    setOverviewReloadToken((currentToken) => currentToken + 1);
    setIsAddCourseModalOpen(false);
  }

  const selectedCourseTitle = useMemo(() => {
    const selectedCourse = courseOptions.find(
      (course) => course.id === selectedCourseId,
    );
    return selectedCourse === undefined ? undefined : selectedCourse.title;
  }, [courseOptions, selectedCourseId]);

  if (isProfileLoading || profile === undefined) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
        <p className="text-text-secondary">Loading educator dashboard…</p>
      </section>
    );
  }

  if (canAccessEducatorPage === false) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
        <p className="text-text-secondary">Redirecting…</p>
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
          disabled={canCreateCourse === false}
          title={
            canCreateCourse
              ? undefined
              : "You need an organisation membership to manage organisation courses."
          }
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
        {canToggleCourseVisibility ? (
          <CourseVisibilityToggle
            selectedVisibility={courseVisibilityFilter}
            onSelectVisibility={setCourseVisibilityFilter}
          />
        ) : undefined}
        {isCoursesLoading ? (
          <p className="text-sm text-text-secondary">Loading courses…</p>
        ) : undefined}
        {coursesErrorMessage === undefined ? undefined : (
          <p className="text-sm text-text-secondary" role="status">
            {coursesErrorMessage}
          </p>
        )}
        {isCoursesLoading === false &&
        coursesErrorMessage === undefined &&
        courseOptions.length === 0 ? (
          <p className="text-sm text-text-secondary" role="status">
            No {courseVisibilityFilter} courses available.
          </p>
        ) : undefined}
        {courseOptions.length > 0 ? (
          <EducatorCourseSelect
            courses={courseOptions}
            selectedCourseId={selectedCourseId}
            onSelectCourse={(courseId) => {
              setSelectedCourseId(courseId);
              setSelectedTabId("overview");
            }}
          />
        ) : undefined}
      </section>

      <section className="mt-6">
        <EducatorMetricsRow
          totalStudents={
            courseOverview === undefined ? 0 : courseOverview.totalStudents
          }
          averagePracticeQuizPercent={
            courseOverview === undefined
              ? 0
              : courseOverview.averagePracticeQuizPercent
          }
          totalQuestions={
            courseOverview === undefined ? 0 : courseOverview.totalQuestions
          }
        />
      </section>

      <article className="mt-8 rounded-2xl border border-border-ui bg-surface p-4 shadow-[0_8px_24px_rgba(30,27,51,0.06)] md:p-6">
        <EducatorTabNav
          selectedTabId={selectedTabId}
          onSelectTab={handleSelectTab}
        />

        {selectedCourseId === "" ? (
          <p className="mt-6 text-sm text-text-secondary">
            Select a course to view educator insights.
          </p>
        ) : undefined}

        {selectedCourseId !== "" &&
        selectedTabId === "overview" &&
        isOverviewLoading ? (
          <p className="mt-6 text-sm text-text-secondary">Loading overview…</p>
        ) : undefined}

        {selectedCourseId !== "" &&
        selectedTabId === "overview" &&
        overviewErrorMessage !== undefined ? (
          <p className="mt-6 text-sm text-coral" role="alert">
            {overviewErrorMessage}
          </p>
        ) : undefined}

        {selectedCourseId !== "" &&
        selectedTabId === "overview" &&
        isOverviewLoading === false &&
        overviewErrorMessage === undefined &&
        courseOverview !== undefined ? (
          <OverviewTab overview={courseOverview} />
        ) : undefined}
        {selectedCourseId !== "" && selectedTabId === "students" ? (
          <StudentsTab
            key={selectedCourseId}
            courseId={selectedCourseId}
            courseTitle={
              selectedCourseTitle === undefined
                ? "this course"
                : selectedCourseTitle
            }
          />
        ) : undefined}
        {selectedCourseId !== "" && selectedTabId === "questions" ? (
          <QuestionsTab
            key={selectedCourseId}
            courseId={selectedCourseId}
            courseTitle={
              selectedCourseTitle === undefined
                ? "this course"
                : selectedCourseTitle
            }
          />
        ) : undefined}
        {selectedCourseId !== "" &&
        selectedTabId === "learning-content" ? (
          <LearningContentTab
            key={selectedCourseId}
            courseId={selectedCourseId}
            courseTitle={
              selectedCourseTitle === undefined
                ? "this course"
                : selectedCourseTitle
            }
          />
        ) : undefined}
      </article>

      {isAddCourseModalOpen ? (
        <AddCourseFormModal
          selectedVisibility={courseVisibilityFilter}
          onClose={() => setIsAddCourseModalOpen(false)}
          onSave={handleCreateCourse}
        />
      ) : undefined}
    </section>
  );
}
