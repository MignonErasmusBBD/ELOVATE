"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { clearFieldError } from "@/helpers/formErrors";
import {
  COURSE_DESCRIPTION_MAX_LENGTH,
  COURSE_TITLE_MAX_LENGTH,
  validateCourseDescription,
  validateCourseTitle,
} from "@/helpers/validation";
import type { EducatorCourseVisibility } from "../types";

export type AddCourseFormValues = {
  courseTitle: string;
  courseDescription: string;
  visibility: EducatorCourseVisibility;
};

type AddCourseFieldErrors = {
  courseTitle?: string;
  courseDescription?: string;
};

type AddCourseFormModalProps = {
  selectedVisibility: EducatorCourseVisibility;
  onClose: () => void;
  onSave: (formValues: AddCourseFormValues) => Promise<void>;
};

export function AddCourseFormModal({
  selectedVisibility,
  onClose,
  onSave,
}: AddCourseFormModalProps) {
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AddCourseFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<
    string | undefined
  >();
  const isCommunityCourse = selectedVisibility === "community";

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isSubmitting === false) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  async function handleSubmit(submitEvent: SubmitEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    const courseTitleError = validateCourseTitle(courseTitle);
    const courseDescriptionError = validateCourseDescription(courseDescription);
    setFieldErrors({
      courseTitle: courseTitleError,
      courseDescription: courseDescriptionError,
    });
    setSubmitErrorMessage(undefined);

    if (
      courseTitleError !== undefined ||
      courseDescriptionError !== undefined
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        courseTitle: courseTitle.trim(),
        courseDescription: courseDescription.trim(),
        visibility: selectedVisibility,
      });
    } catch (errorValue) {
      const message =
        errorValue instanceof Error && errorValue.message !== ""
          ? errorValue.message
          : "Could not create course.";
      setSubmitErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 md:p-8"
      role="presentation"
      onClick={() => {
        if (isSubmitting === false) {
          onClose();
        }
      }}
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
            disabled={isSubmitting}
            className="rounded-lg px-2 py-1 text-lg font-semibold text-text-secondary hover:bg-page disabled:opacity-60"
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
              maxLength={COURSE_TITLE_MAX_LENGTH}
              disabled={isSubmitting}
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
                  : "educator-course-title-limit"
              }
            />
            {fieldErrors.courseTitle !== undefined ? (
              <FieldError
                id="educator-course-title-error"
                message={fieldErrors.courseTitle}
              />
            ) : (
              <p
                id="educator-course-title-limit"
                className="text-xs text-text-secondary"
              >
                {courseTitle.length}/{COURSE_TITLE_MAX_LENGTH} characters
              </p>
            )}
          </FormField>

          <FormField>
            <Label htmlFor="educator-course-description">Description</Label>
            <Input
              id="educator-course-description"
              name="courseDescription"
              type="text"
              placeholder="What will people learn?"
              value={courseDescription}
              maxLength={COURSE_DESCRIPTION_MAX_LENGTH}
              disabled={isSubmitting}
              invalid={fieldErrors.courseDescription !== undefined}
              onChange={(changeEvent) => {
                setCourseDescription(changeEvent.target.value);
                setFieldErrors((currentFieldErrors) =>
                  clearFieldError(currentFieldErrors, "courseDescription"),
                );
              }}
              aria-describedby={
                fieldErrors.courseDescription !== undefined
                  ? "educator-course-description-error"
                  : "educator-course-description-limit"
              }
            />
            {fieldErrors.courseDescription !== undefined ? (
              <FieldError
                id="educator-course-description-error"
                message={fieldErrors.courseDescription}
              />
            ) : (
              <p
                id="educator-course-description-limit"
                className="text-xs text-text-secondary"
              >
                {courseDescription.length}/{COURSE_DESCRIPTION_MAX_LENGTH}{" "}
                characters
              </p>
            )}
          </FormField>

          {isCommunityCourse ? (
            <p
              role="status"
              className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2.5 text-sm text-ink"
            >
              You are adding a <strong>community</strong> course. It starts
              inactive until you activate it for the shared catalogue.
            </p>
          ) : undefined}

          {submitErrorMessage === undefined ? undefined : (
            <p className="text-sm text-coral" role="alert">
              {submitErrorMessage}
            </p>
          )}

          <Button
            variant="compact"
            type="submit"
            className="self-start"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding…" : "Add course"}
          </Button>
        </form>
      </article>
    </div>
  );
}
