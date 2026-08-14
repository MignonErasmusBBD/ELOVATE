"use client";

import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { clearFieldError } from "@/helpers/formErrors";
import { validateRequiredName } from "@/helpers/validation";
import { adminCourses, currentOrganisation } from "../data/placeholder";
import { StatusPill } from "./StatusPill";

type PrivateCourseFieldErrors = {
  courseTitle?: string;
};

const organisationPrivateCourses = adminCourses.filter(
  (course) =>
    course.owningOrganizationId === currentOrganisation.id &&
    course.visibility === "private",
);

export function AdminCoursesSection() {
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<PrivateCourseFieldErrors>({});

  function handleAddCourseSubmit(submitEvent: SubmitEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    const courseTitleError = validateRequiredName(courseTitle, "Course title");
    setFieldErrors({ courseTitle: courseTitleError });

    if (courseTitleError !== undefined) {
      return;
    }
  }

  return (
    <section aria-labelledby="admin-courses-heading" className="mt-8">
      <header className="mb-5">
        <h2 id="admin-courses-heading" className="text-xl font-bold text-ink">
          Private courses
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          These courses belong to {currentOrganisation.name}, not to a single
          educator. Removing the Educator role does not remove the course.
          Enrol people from Enrolments to grant access.
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
            onChange={(changeEvent) =>
              setCourseDescription(changeEvent.target.value)
            }
          />
        </FormField>
        <Button variant="compact" type="submit" className="self-start">
          Add course
        </Button>
      </form>

      <ul className="flex flex-col gap-4">
        {organisationPrivateCourses.map((course) => (
          <li key={course.id}>
            <article className="flex flex-col gap-3 rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)] sm:flex-row sm:items-center sm:justify-between">
              <header>
                <h3 className="text-base font-bold text-ink">{course.title}</h3>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {course.description}
                </p>
                {course.authorFullName !== undefined ? (
                  <p className="mt-2 text-sm text-text-secondary">
                    Authored by {course.authorFullName}
                  </p>
                ) : undefined}
                <p className="mt-2">
                  <StatusPill label="Private" tone="muted" />
                </p>
              </header>
              <ul className="flex gap-4 self-start sm:self-center">
                <li>
                  <button
                    type="button"
                    className="text-sm font-semibold text-coral"
                  >
                    Edit
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="text-sm font-semibold text-coral"
                  >
                    Deactivate
                  </button>
                </li>
              </ul>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
