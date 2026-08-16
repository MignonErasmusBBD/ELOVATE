"use client";

import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { CourseReadinessChecklist } from "@/components/ui/CourseReadinessChecklist";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ActionNotice } from "@/components/ui/ActionNotice";
import { useActionFeedback } from "@/features/platform";
import { errorMessageFromUnknown } from "@/helpers/elovateApi";
import { clearFieldError } from "@/helpers/formErrors";
import {
  COURSE_DESCRIPTION_MAX_LENGTH,
  COURSE_TITLE_MAX_LENGTH,
  validateCourseDescription,
  validateCourseTitle,
} from "@/helpers/validation";
import { canActivateCourse } from "@/helpers/courseReadiness";
import { setCourseStatus } from "../orgAdminApi";
import {
  emptyStatusFilterMessage,
  itemsMatchingStatusAndSearch,
  type StatusFilter,
  type StatusFilterOption,
} from "../statusFilter";
import type { AdminCourse, CourseStatus } from "../types";
import { StatusFilterNav } from "./StatusFilterNav";
import { StatusPill } from "./StatusPill";

type CourseFieldErrors = {
  courseTitle?: string;
  courseDescription?: string;
};

const courseStatusFilters: StatusFilterOption<StatusFilter<CourseStatus>>[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "active", label: "Active" },
  { id: "deactivated", label: "Deactivated" },
];

function courseStatusPresentation(status: CourseStatus): {
  label: string;
  tone: "success" | "warning" | "danger";
} {
  if (status === "active") {
    return { label: "Active", tone: "success" };
  }
  if (status === "draft") {
    return { label: "Draft", tone: "warning" };
  }
  return { label: "Deactivated", tone: "danger" };
}

type AdminCoursesSectionProps = Readonly<{
  heading: string;
  description: string;
  emptyMessage: string;
  titleFieldId: string;
  titlePlaceholder: string;
  descriptionFieldId: string;
  searchInputId: string;
  visibilityLabel: string;
  canCreate: boolean;
  createBlockedMessage: string | undefined;
  courses: AdminCourse[];
  isLoading: boolean;
  onCreate: (
    title: string,
    description: string | undefined,
  ) => Promise<AdminCourse | undefined>;
  onCoursesChange: (nextCourses: AdminCourse[]) => void;
  onDirectoryChanged: () => Promise<void>;
}>;

export function AdminCoursesSection({
  heading,
  description,
  emptyMessage,
  titleFieldId,
  titlePlaceholder,
  descriptionFieldId,
  searchInputId,
  visibilityLabel,
  canCreate,
  createBlockedMessage,
  courses,
  isLoading,
  onCreate,
  onCoursesChange,
  onDirectoryChanged,
}: AdminCoursesSectionProps) {
  const { showSuccess } = useActionFeedback();
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CourseFieldErrors>({});
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter<CourseStatus>>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [formError, setFormError] = useState<string | undefined>();
  const [actionError, setActionError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  const visibleCourses = itemsMatchingStatusAndSearch(
    courses,
    statusFilter,
    searchQuery,
    (course) => course.status,
    (course) => {
      if (course.description === undefined) {
        return [course.title];
      }
      return [course.title, course.description];
    },
  );

  async function handleAddCourseSubmit(
    submitEvent: SubmitEvent<HTMLFormElement>,
  ) {
    submitEvent.preventDefault();

    const courseTitleError = validateCourseTitle(courseTitle);
    const courseDescriptionError = validateCourseDescription(courseDescription);
    setFieldErrors({
      courseTitle: courseTitleError,
      courseDescription: courseDescriptionError,
    });
    setFormError(undefined);
    setActionError(undefined);

    if (
      courseTitleError !== undefined ||
      courseDescriptionError !== undefined
    ) {
      return;
    }
    if (canCreate === false) {
      setFormError(createBlockedMessage ?? "You cannot create a course.");
      return;
    }

    setIsSaving(true);
    try {
      const createdCourse = await onCreate(
        courseTitle.trim(),
        courseDescription.trim() === "" ? undefined : courseDescription.trim(),
      );
      if (createdCourse === undefined) {
        setFormError("Could not create that course.");
        return;
      }
      onCoursesChange([createdCourse, ...courses]);
      setCourseTitle("");
      setCourseDescription("");
      showSuccess(
        `${createdCourse.title} was created as a draft. Learners cannot see it until it has a section, 20 active questions, and is activated.`,
      );
    } catch (error) {
      setFormError(
        errorMessageFromUnknown(error, "Could not create that course."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function persistCourseStatus(
    course: AdminCourse,
    status: CourseStatus,
  ) {
    if (
      status === "active" &&
      canActivateCourse(course) === false
    ) {
      setActionError(
        "This course needs at least one section and 20 active questions before it can be activated.",
      );
      return;
    }
    setActionError(undefined);
    onCoursesChange(
      courses.map((candidate) => {
        if (candidate.id !== course.id) {
          return candidate;
        }
        return {
          ...candidate,
          status,
        };
      }),
    );
    try {
      await setCourseStatus(course.id, status);
      showSuccess(
        status === "active"
          ? `${course.title} is now active. Learners who are enrolled can open the lesson and quiz.`
          : `${course.title} was deactivated. New enrolments stop; people already enrolled can still open it as read-only.`,
      );
    } catch (error) {
      setActionError(
        errorMessageFromUnknown(error, "Could not update course status."),
      );
      await onDirectoryChanged();
    }
  }

  return (
    <section aria-labelledby="admin-courses-heading" className="mt-8">
      <header className="mb-5">
        <h2 id="admin-courses-heading" className="text-xl font-bold text-ink">
          {heading}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </header>

      <form
        className="mb-6 flex flex-col gap-4 rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]"
        onSubmit={handleAddCourseSubmit}
        noValidate
      >
        <FormField>
          <Label htmlFor={titleFieldId}>Course title</Label>
          <Input
            id={titleFieldId}
            name="courseTitle"
            type="text"
            placeholder={titlePlaceholder}
            value={courseTitle}
            maxLength={COURSE_TITLE_MAX_LENGTH}
            disabled={isSaving}
            invalid={fieldErrors.courseTitle !== undefined}
            onChange={(changeEvent) => {
              setCourseTitle(changeEvent.target.value);
              setFieldErrors((currentFieldErrors) =>
                clearFieldError(currentFieldErrors, "courseTitle"),
              );
            }}
            aria-describedby={
              fieldErrors.courseTitle !== undefined
                ? `${titleFieldId}-error`
                : `${titleFieldId}-limit`
            }
          />
          {fieldErrors.courseTitle !== undefined ? (
            <FieldError
              id={`${titleFieldId}-error`}
              message={fieldErrors.courseTitle}
            />
          ) : (
            <p
              id={`${titleFieldId}-limit`}
              className="text-xs text-text-secondary"
            >
              {courseTitle.length}/{COURSE_TITLE_MAX_LENGTH} characters
            </p>
          )}
        </FormField>
        <FormField>
          <Label htmlFor={descriptionFieldId}>Description</Label>
          <Input
            id={descriptionFieldId}
            name="courseDescription"
            type="text"
            placeholder="What will people learn?"
            value={courseDescription}
            maxLength={COURSE_DESCRIPTION_MAX_LENGTH}
            disabled={isSaving}
            invalid={fieldErrors.courseDescription !== undefined}
            onChange={(changeEvent) => {
              setCourseDescription(changeEvent.target.value);
              setFieldErrors((currentFieldErrors) =>
                clearFieldError(currentFieldErrors, "courseDescription"),
              );
            }}
            aria-describedby={
              fieldErrors.courseDescription !== undefined
                ? `${descriptionFieldId}-error`
                : `${descriptionFieldId}-limit`
            }
          />
          {fieldErrors.courseDescription !== undefined ? (
            <FieldError
              id={`${descriptionFieldId}-error`}
              message={fieldErrors.courseDescription}
            />
          ) : (
            <p
              id={`${descriptionFieldId}-limit`}
              className="text-xs text-text-secondary"
            >
              {courseDescription.length}/{COURSE_DESCRIPTION_MAX_LENGTH}{" "}
              characters
            </p>
          )}
        </FormField>
        {formError === undefined ? undefined : (
          <FieldError id="course-form-error" message={formError} />
        )}
        <Button
          variant="compact"
          type="submit"
          className="self-start"
          isBusy={isSaving}
          disabled={canCreate === false}
        >
          {isSaving ? "Adding…" : "Add course"}
        </Button>
      </form>

      {actionError === undefined ? undefined : (
        <ActionNotice
          tone="error"
          message={actionError}
          className="mb-4"
        />
      )}

      {courses.length > 0 ? (
        <StatusFilterNav
          ariaLabel="Course status"
          filters={courseStatusFilters}
          selectedFilter={statusFilter}
          onSelectFilter={setStatusFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          searchInputId={searchInputId}
          searchLabel="Search courses"
          searchPlaceholder="Search courses"
        />
      ) : undefined}

      {isLoading && courses.length === 0 ? (
        <p className="text-sm text-text-secondary">Loading courses…</p>
      ) : undefined}

      {isLoading === false && courses.length === 0 ? (
        <p className="text-sm text-text-secondary">{emptyMessage}</p>
      ) : undefined}

      {courses.length > 0 && visibleCourses.length === 0 ? (
        <p className="text-sm text-text-secondary">
          {emptyStatusFilterMessage(statusFilter, searchQuery, "courses")}
        </p>
      ) : undefined}

      <ul className="flex min-w-0 flex-col gap-4">
        {visibleCourses.map((course) => {
          const isActive = course.status === "active";
          const statusPresentation = courseStatusPresentation(course.status);
          const isReadyToActivate = canActivateCourse(course);

          return (
            <li key={course.id} className="min-w-0">
              <article className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
                <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <section className="flex min-w-0 flex-1 flex-wrap items-center gap-2 overflow-hidden">
                    <h3 className="min-w-0 max-w-full truncate text-base font-bold text-ink">
                      {course.title}
                    </h3>
                    <StatusPill
                      label={statusPresentation.label}
                      tone={statusPresentation.tone}
                    />
                    <StatusPill label={visibilityLabel} tone="muted" />
                    {course.description === undefined ? undefined : (
                      <p
                        className="mt-1 w-full line-clamp-2 break-words text-sm text-text-secondary"
                        title={course.description}
                      >
                        {course.description}
                      </p>
                    )}
                  </section>
                  {isActive ? (
                    <Button
                      variant="outline"
                      type="button"
                      className="shrink-0 self-start"
                      onClick={() =>
                        void persistCourseStatus(course, "deactivated")
                      }
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="compact"
                      type="button"
                      className="shrink-0 self-start"
                      disabled={isReadyToActivate === false}
                      title={
                        isReadyToActivate
                          ? undefined
                          : "Add at least one section and 20 active questions first."
                      }
                      onClick={() => void persistCourseStatus(course, "active")}
                    >
                      Activate
                    </Button>
                  )}
                </header>
                {course.status === "draft" ? (
                  <p className="text-sm text-text-secondary">
                    Please go to the educator&apos;s dashboard and add content
                    and a minimum of 20 questions for this course for it to be
                    able to move to active.
                  </p>
                ) : undefined}
                {isActive ? undefined : (
                  <CourseReadinessChecklist
                    sectionCount={course.sectionCount}
                    activeQuestionCount={course.activeQuestionCount}
                  />
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
