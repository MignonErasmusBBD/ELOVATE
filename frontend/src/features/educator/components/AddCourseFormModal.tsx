"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { clearFieldError } from "@/helpers/formErrors";
import { validateRequiredName } from "@/helpers/validation";
import type { EducatorCourseVisibility } from "../types";

export type AddCourseFormValues = {
  courseTitle: string;
  courseDescription: string;
  visibility: EducatorCourseVisibility;
};

type AddCourseFieldErrors = {
  courseTitle?: string;
};

type AddCourseFormModalProps = {
  selectedVisibility: EducatorCourseVisibility;
  onClose: () => void;
  onSave: (formValues: AddCourseFormValues) => void;
};

export function AddCourseFormModal({
  selectedVisibility,
  onClose,
  onSave,
}: AddCourseFormModalProps) {
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AddCourseFieldErrors>({});
  const isCommunityCourse = selectedVisibility === "community";

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(submitEvent: SubmitEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    const courseTitleError = validateRequiredName(courseTitle, "Course title");
    setFieldErrors({ courseTitle: courseTitleError });

    if (courseTitleError !== undefined) {
      return;
    }

    onSave({
      courseTitle: courseTitle.trim(),
      courseDescription: courseDescription.trim(),
      visibility: selectedVisibility,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 md:p-8"
      role="presentation"
      onClick={onClose}
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-course-form-title"
        className="my-4 w-full max-w-2xl rounded-2xl border border-border-ui bg-surface p-6 shadow-[0_16px_48px_rgba(30,27,51,0.2)] md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <h2
            id="add-course-form-title"
            className="text-2xl font-bold tracking-tight text-ink"
          >
            Add course
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-lg font-semibold text-text-secondary hover:bg-page"
            aria-label="Close add course form"
          >
            ×
          </button>
        </header>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <FormField>
            <Label htmlFor="educator-course-title">Course title</Label>
            <Input
              id="educator-course-title"
              name="courseTitle"
              type="text"
              placeholder="Course title"
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
                  ? "educator-course-title-error"
                  : undefined
              }
            />
            {fieldErrors.courseTitle !== undefined ? (
              <FieldError
                id="educator-course-title-error"
                message={fieldErrors.courseTitle}
              />
            ) : undefined}
          </FormField>

          <FormField>
            <Label htmlFor="educator-course-description">Description</Label>
            <Input
              id="educator-course-description"
              name="courseDescription"
              type="text"
              placeholder="What will people learn?"
              value={courseDescription}
              onChange={(changeEvent) =>
                setCourseDescription(changeEvent.target.value)
              }
            />
          </FormField>

          {isCommunityCourse ? (
            <p
              role="status"
              className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2.5 text-sm text-ink"
            >
              You are adding a <strong>community</strong> course. It will be
              visible to everyone in the shared catalogue.
            </p>
          ) : undefined}

          <Button variant="compact" type="submit" className="self-start">
            Add course
          </Button>
        </form>
      </article>
    </div>
  );
}
