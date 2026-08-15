"use client";

import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { errorMessageFromUnknown } from "@/helpers/elovateApi";
import { clearFieldError } from "@/helpers/formErrors";
import { validateRequiredName } from "@/helpers/validation";
import { createOrgPrivateCourse, setCourseStatus } from "../orgAdminApi";
import {
  emptyStatusFilterMessage,
  itemsMatchingStatusAndSearch,
  type StatusFilter,
  type StatusFilterOption,
} from "../statusFilter";
import type { CourseStatus, OrgPrivateCourse } from "../types";
import { StatusFilterNav } from "./StatusFilterNav";
import { StatusPill } from "./StatusPill";

type PrivateCourseFieldErrors = {
  courseTitle?: string;
};

const courseStatusFilters: StatusFilterOption<StatusFilter<CourseStatus>>[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "deactivated", label: "Deactivated" },
];

type AdminCoursesSectionProps = Readonly<{
  organizationName: string | undefined;
  organizationId: string | undefined;
  courses: OrgPrivateCourse[];
  isLoading: boolean;
  onCoursesChange: (nextCourses: OrgPrivateCourse[]) => void;
  onDirectoryChanged: () => Promise<void>;
}>;

export function AdminCoursesSection({
  organizationName,
  organizationId,
  courses,
  isLoading,
  onCoursesChange,
  onDirectoryChanged,
}: AdminCoursesSectionProps) {
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<PrivateCourseFieldErrors>({});
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter<CourseStatus>>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [formError, setFormError] = useState<string | undefined>();
  const [actionError, setActionError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const organisationName = organizationName ?? "your organisation";

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

    const courseTitleError = validateRequiredName(courseTitle, "Course title");
    setFieldErrors({ courseTitle: courseTitleError });
    setFormError(undefined);
    setActionError(undefined);

    if (courseTitleError !== undefined) {
      return;
    }
    if (organizationId === undefined) {
      setFormError("You need an organisation to create private courses.");
      return;
    }

    setIsSaving(true);
    try {
      const createdCourse = await createOrgPrivateCourse(
        organizationId,
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
    } catch (error) {
      setFormError(
        errorMessageFromUnknown(error, "Could not create that course."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function persistCourseStatus(
    course: OrgPrivateCourse,
    status: CourseStatus,
  ) {
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
          Private courses
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          These courses belong to {organisationName}, not to a single educator.
          Removing the Educator role does not remove the course. Enrol people
          from Enrolments to grant access.
        </p>
      </header>

      <form
        className="mb-6 flex flex-col gap-4 rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]"
        onSubmit={handleAddCourseSubmit}
        noValidate
      >
        <FormField>
          <Label htmlFor="private-course-title">Course title</Label>
          <Input
            id="private-course-title"
            name="courseTitle"
            type="text"
            placeholder="Private course title"
            value={courseTitle}
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
                ? "private-course-title-error"
                : undefined
            }
          />
          {fieldErrors.courseTitle !== undefined ? (
            <FieldError
              id="private-course-title-error"
              message={fieldErrors.courseTitle}
            />
          ) : undefined}
        </FormField>
        <FormField>
          <Label htmlFor="private-course-description">Description</Label>
          <Input
            id="private-course-description"
            name="courseDescription"
            type="text"
            placeholder="What will people learn?"
            value={courseDescription}
            disabled={isSaving}
            onChange={(changeEvent) =>
              setCourseDescription(changeEvent.target.value)
            }
          />
        </FormField>
        {formError === undefined ? undefined : (
          <FieldError id="private-course-form-error" message={formError} />
        )}
        <Button
          variant="compact"
          type="submit"
          className="self-start"
          disabled={isSaving || organizationId === undefined}
        >
          {isSaving ? "Adding…" : "Add course"}
        </Button>
      </form>

      {actionError === undefined ? undefined : (
        <p className="mb-4 text-sm text-coral" role="alert">
          {actionError}
        </p>
      )}

      {courses.length > 0 ? (
        <StatusFilterNav
          ariaLabel="Course status"
          filters={courseStatusFilters}
          selectedFilter={statusFilter}
          onSelectFilter={setStatusFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          searchInputId="courses-search"
          searchLabel="Search courses"
          searchPlaceholder="Search courses"
        />
      ) : undefined}

      {isLoading && courses.length === 0 ? (
        <p className="text-sm text-text-secondary">Loading courses…</p>
      ) : undefined}

      {isLoading === false && courses.length === 0 ? (
        <p className="text-sm text-text-secondary">
          No private courses in {organisationName} yet. Add one above.
        </p>
      ) : undefined}

      {courses.length > 0 && visibleCourses.length === 0 ? (
        <p className="text-sm text-text-secondary">
          {emptyStatusFilterMessage(statusFilter, searchQuery, "courses")}
        </p>
      ) : undefined}

      <ul className="flex flex-col gap-4">
        {visibleCourses.map((course) => {
          const isActive = course.status === "active";

          return (
            <li key={course.id}>
              <article className="flex flex-col gap-3 rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)] sm:flex-row sm:items-center sm:justify-between">
                <header>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-ink">
                      {course.title}
                    </h3>
                    <StatusPill
                      label={isActive ? "Active" : "Deactivated"}
                      tone={isActive ? "success" : "danger"}
                    />
                    <StatusPill label="Private" tone="muted" />
                  </div>
                  {course.description === undefined ? undefined : (
                    <p className="mt-1 text-sm text-text-secondary">
                      {course.description}
                    </p>
                  )}
                </header>
                {isActive ? (
                  <Button
                    variant="outline"
                    type="button"
                    className="self-start sm:self-center"
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
                    className="self-start sm:self-center"
                    onClick={() => void persistCourseStatus(course, "active")}
                  >
                    Activate
                  </Button>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
