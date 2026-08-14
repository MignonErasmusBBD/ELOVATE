"use client";

import { useEffect, useState } from "react";
import type { LearningContentSection } from "../types";

export type LearningContentFormValues = {
  title: string;
  content: string;
};

type LearningContentFormModalProps = {
  initialSection?: LearningContentSection;
  onClose: () => void;
  onSave: (formValues: LearningContentFormValues) => void;
};

export function LearningContentFormModal({
  initialSection,
  onClose,
  onSave,
}: LearningContentFormModalProps) {
  const isEditing = initialSection !== undefined;
  const [sectionTitle, setSectionTitle] = useState(initialSection?.title ?? "");
  const [sectionContent, setSectionContent] = useState(
    initialSection?.content ?? "",
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 md:p-8"
      role="presentation"
      onClick={onClose}
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="learning-content-form-title"
        className="my-4 w-full max-w-4xl rounded-2xl border border-border-ui bg-surface p-6 shadow-[0_16px_48px_rgba(30,27,51,0.2)] md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <h2
            id="learning-content-form-title"
            className="text-2xl font-bold tracking-tight text-ink"
          >
            {isEditing ? "Edit Section" : "Add New Section"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-lg font-semibold text-text-secondary hover:bg-page"
            aria-label="Close section form"
          >
            ×
          </button>
        </header>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (sectionTitle.trim() === "" || sectionContent.trim() === "") {
              return;
            }

            onSave({
              title: sectionTitle.trim(),
              content: sectionContent.trim(),
            });
          }}
        >
          <label className="block">
            <span className="text-sm font-semibold text-ink">
              Section / topic name *
            </span>
            <input
              required
              type="text"
              value={sectionTitle}
              onChange={(event) => setSectionTitle(event.target.value)}
              placeholder="e.g. Introduction"
              className="mt-2 w-full rounded-lg border border-border-ui bg-surface px-3 py-2.5 text-sm text-ink"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink">Content *</span>
            <textarea
              required
              value={sectionContent}
              onChange={(event) => setSectionContent(event.target.value)}
              placeholder="Write the learning content for this section..."
              className="mt-2 min-h-48 w-full rounded-lg border border-border-ui bg-surface px-3 py-2 text-sm leading-relaxed text-ink"
            />
          </label>

          <menu className="mt-2 flex list-none justify-end gap-3 p-0">
            <li>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border-ui bg-surface px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-page"
              >
                Cancel
              </button>
            </li>
            <li>
              <button
                type="submit"
                className="rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:brightness-[0.97]"
              >
                {isEditing ? "Save Changes" : "Create Section"}
              </button>
            </li>
          </menu>
        </form>
      </article>
    </div>
  );
}
