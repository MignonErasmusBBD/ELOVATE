"use client";

import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { clearFieldError } from "@/helpers/formErrors";
import { validateRequiredName } from "@/helpers/validation";
import { AdminPageHeader } from "./AdminPageHeader";

type CommunityCourseFieldErrors = {
  courseTitle?: string;
};

export function CommunityAdminPage() {
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CommunityCourseFieldErrors>(
    {},
  );

  function handleAddCourseSubmit(submitEvent: SubmitEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    const courseTitleError = validateRequiredName(courseTitle, "Course title");
    setFieldErrors({ courseTitle: courseTitleError });

    if (courseTitleError !== undefined) {
      return;
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
      <AdminPageHeader
        title="Community Admin"
        description="Add and curate public courses available to every learner. Deactivating a course hides it from the shared catalogue."
      />

      <form
        className="mt-10 flex flex-col gap-4 rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]"
        onSubmit={handleAddCourseSubmit}
        noValidate
      >
        <h2 className="text-lg font-bold text-ink">Add public course</h2>
        <FormField>
          <Label htmlFor="community-course-title">Course title</Label>
          <Input
            id="community-course-title"
            name="courseTitle"
            type="text"
            placeholder="Public course title"
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
                ? "community-course-title-error"
                : undefined
            }
          />
          {fieldErrors.courseTitle !== undefined ? (
            <FieldError
              id="community-course-title-error"
              message={fieldErrors.courseTitle}
            />
          ) : undefined}
        </FormField>
        <FormField>
          <Label htmlFor="community-course-description">Description</Label>
          <Input
            id="community-course-description"
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

      <section aria-labelledby="community-courses-heading" className="mt-10">
        <header className="mb-5">
          <h2
            id="community-courses-heading"
            className="text-xl font-bold text-ink"
          >
            Public courses
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            These courses appear in the shared catalogue for everyone, across
            organisations.
          </p>
        </header>

        <p className="text-sm text-text-secondary">No public courses.</p>
      </section>
    </section>
  );
}
