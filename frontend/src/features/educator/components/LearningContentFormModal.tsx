"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import type { LearningContentType } from "@/helpers/learningContentApi";
import type { LearningContentSection } from "../types";

export type LearningContentFormBlock = {
  key: string;
  contentType: LearningContentType;
  bodyText: string;
};

export type LearningContentFormValues = {
  title: string;
  contentBlocks: LearningContentFormBlock[];
};

type LearningContentFormModalProps = {
  initialSection?: LearningContentSection;
  isSubmitting?: boolean;
  submitErrorMessage?: string;
  onClose: () => void;
  onSave: (formValues: LearningContentFormValues) => void | Promise<void>;
};

function createBlockKey(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

function defaultBlocks(): LearningContentFormBlock[] {
  return [{ key: createBlockKey("new", 0), contentType: "text", bodyText: "" }];
}

export function LearningContentFormModal({
  initialSection,
  isSubmitting = false,
  submitErrorMessage,
  onClose,
  onSave,
}: LearningContentFormModalProps) {
  const isEditing = initialSection !== undefined;
  const [sectionTitle, setSectionTitle] = useState(initialSection?.title ?? "");
  const [contentBlocks, setContentBlocks] = useState<LearningContentFormBlock[]>(
    () => {
      if (initialSection === undefined || initialSection.contentBlocks.length === 0) {
        return defaultBlocks();
      }
      return initialSection.contentBlocks.map((block) => ({
        key: block.id,
        contentType: block.contentType,
        bodyText: block.bodyText,
      }));
    },
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isSubmitting === false) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  function updateBlock(
    blockKey: string,
    patch: Partial<Pick<LearningContentFormBlock, "contentType" | "bodyText">>,
  ) {
    setContentBlocks((previousBlocks) =>
      previousBlocks.map((block) => {
        if (block.key !== blockKey) {
          return block;
        }
        return { ...block, ...patch };
      }),
    );
  }

  function removeBlock(blockKey: string) {
    setContentBlocks((previousBlocks) => {
      if (previousBlocks.length <= 1) {
        return previousBlocks;
      }
      return previousBlocks.filter((block) => block.key !== blockKey);
    });
  }

  function moveBlock(blockKey: string, direction: -1 | 1) {
    setContentBlocks((previousBlocks) => {
      const currentIndex = previousBlocks.findIndex(
        (block) => block.key === blockKey,
      );
      if (currentIndex < 0) {
        return previousBlocks;
      }
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= previousBlocks.length) {
        return previousBlocks;
      }
      const nextBlocks = [...previousBlocks];
      const currentBlock = nextBlocks[currentIndex];
      const swapBlock = nextBlocks[nextIndex];
      if (currentBlock === undefined || swapBlock === undefined) {
        return previousBlocks;
      }
      nextBlocks[currentIndex] = swapBlock;
      nextBlocks[nextIndex] = currentBlock;
      return nextBlocks;
    });
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
            disabled={isSubmitting}
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
            if (sectionTitle.trim() === "") {
              return;
            }
            const hasContent = contentBlocks.some(
              (block) => block.bodyText.trim() !== "",
            );
            if (hasContent === false) {
              return;
            }

            void onSave({
              title: sectionTitle.trim(),
              contentBlocks: contentBlocks.map((block) => ({
                ...block,
                bodyText: block.bodyText.trim(),
              })),
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
              disabled={isSubmitting}
              onChange={(event) => setSectionTitle(event.target.value)}
              placeholder="e.g. Introduction"
              className="mt-2 w-full rounded-lg border border-border-ui bg-surface px-3 py-2.5 text-sm text-ink"
            />
          </label>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold text-ink">
              Content blocks *
            </legend>
            <p className="text-sm text-text-secondary">
              Mix text and code snippets in order. Students see them top to
              bottom.
            </p>

            {contentBlocks.map((block, blockIndex) => (
              <article
                key={block.key}
                className="rounded-xl border border-border-ui bg-page p-4"
              >
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-ink">
                    <span>Type</span>
                    <select
                      value={block.contentType}
                      disabled={isSubmitting}
                      onChange={(event) => {
                        const nextType = event.target.value;
                        if (nextType !== "text" && nextType !== "code") {
                          return;
                        }
                        updateBlock(block.key, { contentType: nextType });
                      }}
                      className="rounded-lg border border-border-ui bg-surface px-2 py-1.5 text-sm"
                    >
                      <option value="text">Text</option>
                      <option value="code">Code</option>
                    </select>
                  </label>
                  <menu className="flex list-none gap-2 p-0">
                    <li>
                      <button
                        type="button"
                        disabled={isSubmitting || blockIndex === 0}
                        onClick={() => moveBlock(block.key, -1)}
                        className="rounded-lg border border-border-ui bg-surface px-2 py-1 text-xs font-semibold text-ink disabled:opacity-40"
                      >
                        Up
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        disabled={
                          isSubmitting || blockIndex === contentBlocks.length - 1
                        }
                        onClick={() => moveBlock(block.key, 1)}
                        className="rounded-lg border border-border-ui bg-surface px-2 py-1 text-xs font-semibold text-ink disabled:opacity-40"
                      >
                        Down
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        disabled={isSubmitting || contentBlocks.length <= 1}
                        onClick={() => removeBlock(block.key)}
                        className="rounded-lg border border-border-ui bg-surface px-2 py-1 text-xs font-semibold text-coral disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </li>
                  </menu>
                </header>
                <label className="mt-3 block">
                  <span className="sr-only">
                    {block.contentType === "code" ? "Code" : "Text"} content
                  </span>
                  <textarea
                    value={block.bodyText}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      updateBlock(block.key, { bodyText: event.target.value })
                    }
                    placeholder={
                      block.contentType === "code"
                        ? "Paste a code snippet…"
                        : "Write learning content…"
                    }
                    className={`mt-1 min-h-28 w-full rounded-lg border border-border-ui bg-surface px-3 py-2 text-sm leading-relaxed text-ink ${
                      block.contentType === "code" ? "font-mono" : ""
                    }`}
                  />
                </label>
              </article>
            ))}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                setContentBlocks((previousBlocks) => [
                  ...previousBlocks,
                  {
                    key: `added-${Date.now()}-${previousBlocks.length}`,
                    contentType: "text",
                    bodyText: "",
                  },
                ])
              }
              className="self-start rounded-lg border border-ink bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-page"
            >
              + Add block
            </button>
          </fieldset>

          {submitErrorMessage === undefined ? undefined : (
            <p className="text-sm text-coral" role="alert">
              {submitErrorMessage}
            </p>
          )}

          <menu className="mt-2 flex list-none justify-end gap-3 p-0">
            <li>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg border border-border-ui bg-surface px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-page"
              >
                Cancel
              </button>
            </li>
            <li>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:brightness-[0.97] disabled:opacity-60"
              >
                {isSubmitting ? <Spinner className="size-4" /> : undefined}
                {isSubmitting
                  ? "Saving…"
                  : isEditing
                    ? "Save Changes"
                    : "Create Section"}
              </button>
            </li>
          </menu>
        </form>
      </article>
    </div>
  );
}
