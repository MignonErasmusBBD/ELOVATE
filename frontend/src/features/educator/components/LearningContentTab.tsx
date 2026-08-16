"use client";

import { useEffect, useState } from "react";
import { errorMessageFromUnknown } from "@/helpers/elovateApi";
import {
  createLearningContentSection,
  deleteLearningContentSection,
  listLearningContentSections,
  replaceLearningContentSection,
  type LearningContentSection as ApiLearningContentSection,
} from "@/helpers/learningContentApi";
import { listQuestions } from "@/helpers/questionsApi";
import type { LearningContentSection } from "../types";
import {
  LearningContentFormModal,
  type LearningContentFormValues,
} from "./LearningContentFormModal";

type LearningContentTabProps = {
  courseId: string;
  courseTitle: string;
  onReadinessChange?: (counts: {
    sectionCount: number;
    activeQuestionCount: number;
  }) => void;
};

type SectionModalMode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; sectionId: string };

function toUiSection(section: ApiLearningContentSection): LearningContentSection {
  return {
    id: section.id,
    title: section.title,
    position: section.position,
    contentBlocks: section.contentBlocks,
  };
}

function previewText(section: LearningContentSection): string {
  const firstTextBlock = section.contentBlocks.find(
    (block) => block.contentType === "text" && block.bodyText !== "",
  );
  if (firstTextBlock !== undefined) {
    return firstTextBlock.bodyText;
  }
  const firstBlock = section.contentBlocks[0];
  if (firstBlock === undefined) {
    return "No content yet.";
  }
  return firstBlock.bodyText === "" ? "No content yet." : firstBlock.bodyText;
}

export function LearningContentTab({
  courseId,
  courseTitle,
  onReadinessChange,
}: LearningContentTabProps) {
  const [sections, setSections] = useState<LearningContentSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | undefined>();
  const [reloadToken, setReloadToken] = useState(0);
  const [expandedSectionId, setExpandedSectionId] = useState<string | undefined>();
  const [sectionModalMode, setSectionModalMode] = useState<SectionModalMode>({
    kind: "closed",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<
    string | undefined
  >();

  useEffect(() => {
    let cancelled = false;

    async function loadSections() {
      setIsLoading(true);
      setLoadErrorMessage(undefined);
      try {
        const [apiSections, activeQuestions] = await Promise.all([
          listLearningContentSections(courseId),
          listQuestions({ courseId, status: "active" }),
        ]);
        if (cancelled) {
          return;
        }
        const nextSections = apiSections.map(toUiSection);
        setSections(nextSections);
        if (onReadinessChange !== undefined) {
          onReadinessChange({
            sectionCount: nextSections.length,
            activeQuestionCount: activeQuestions.length,
          });
        }
        setExpandedSectionId((currentId) => {
          if (
            currentId !== undefined &&
            nextSections.some((section) => section.id === currentId)
          ) {
            return currentId;
          }
          return nextSections[0]?.id;
        });
      } catch (error) {
        if (cancelled === false) {
          setSections([]);
          setLoadErrorMessage(
            errorMessageFromUnknown(error, "Could not load learning content."),
          );
        }
      } finally {
        if (cancelled === false) {
          setIsLoading(false);
        }
      }
    }

    void loadSections();
    return () => {
      cancelled = true;
    };
  }, [courseId, onReadinessChange, reloadToken]);

  const editingSection =
    sectionModalMode.kind === "edit"
      ? sections.find((section) => section.id === sectionModalMode.sectionId)
      : undefined;

  async function handleSaveSection(formValues: LearningContentFormValues) {
    setIsSubmitting(true);
    setSubmitErrorMessage(undefined);
    const contentBlocks = formValues.contentBlocks
      .filter((block) => block.bodyText !== "")
      .map((block, blockIndex) => ({
        contentType: block.contentType,
        bodyText: block.bodyText,
        position: blockIndex,
      }));

    try {
      if (sectionModalMode.kind === "create") {
        const created = await createLearningContentSection(courseId, {
          title: formValues.title,
          position: sections.length,
          contentBlocks,
        });
        setExpandedSectionId(created.id);
      } else if (
        sectionModalMode.kind === "edit" &&
        editingSection !== undefined
      ) {
        await replaceLearningContentSection(courseId, editingSection.id, {
          title: formValues.title,
          position: editingSection.position,
          contentBlocks,
        });
      }
      setSectionModalMode({ kind: "closed" });
      setReloadToken((currentToken) => currentToken + 1);
    } catch (error) {
      setSubmitErrorMessage(
        errorMessageFromUnknown(error, "Could not save learning section."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSection(sectionId: string) {
    setSubmitErrorMessage(undefined);
    try {
      await deleteLearningContentSection(courseId, sectionId);
      if (expandedSectionId === sectionId) {
        setExpandedSectionId(undefined);
      }
      setReloadToken((currentToken) => currentToken + 1);
    } catch (error) {
      setLoadErrorMessage(
        errorMessageFromUnknown(error, "Could not delete learning section."),
      );
    }
  }

  return (
    <section
      aria-labelledby="learning-content-heading"
      className="mt-6 min-w-0"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="learning-content-heading"
          className="min-w-0 break-words text-xl font-bold tracking-tight text-ink"
        >
          Learning content for {courseTitle}
        </h2>
        <button
          type="button"
          onClick={() => {
            setSubmitErrorMessage(undefined);
            setSectionModalMode({ kind: "create" });
          }}
          className="rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:brightness-[0.97]"
        >
          + Add Section
        </button>
      </header>

      {isLoading ? (
        <p className="mt-4 text-sm text-text-secondary">Loading learning content…</p>
      ) : undefined}

      {loadErrorMessage === undefined ? undefined : (
        <p className="mt-4 text-sm text-coral" role="alert">
          {loadErrorMessage}
        </p>
      )}

      {isLoading === false &&
      loadErrorMessage === undefined &&
      sections.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          No learning sections yet. Add a section to get started.
        </p>
      ) : undefined}

      {sections.length === 0 ? undefined : (
        <ul className="mt-4 flex list-none flex-col gap-3 p-0">
          {sections.map((section) => {
            const isExpanded = expandedSectionId === section.id;

            return (
              <li key={section.id} className="min-w-0">
                <article className="min-w-0 overflow-hidden rounded-2xl border border-border-ui bg-surface shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
                  <button
                    type="button"
                    className="flex w-full min-w-0 items-start justify-between gap-3 px-4 py-4 text-left sm:px-5"
                    onClick={() =>
                      setExpandedSectionId(isExpanded ? undefined : section.id)
                    }
                    aria-expanded={isExpanded}
                  >
                    <span className="min-w-0">
                      <span className="block break-words text-base font-bold text-ink">
                        {section.title}
                      </span>
                      {isExpanded === false ? (
                        <span className="mt-1 line-clamp-2 block break-words text-sm text-text-secondary">
                          {previewText(section)}
                        </span>
                      ) : undefined}
                    </span>
                    <span className="text-sm font-semibold text-text-secondary">
                      {isExpanded ? "▴" : "▾"}
                    </span>
                  </button>

                  {isExpanded ? (
                    <section className="min-w-0 border-t border-border-ui px-4 py-4 sm:px-5">
                      <ul className="flex list-none flex-col gap-3 p-0">
                        {section.contentBlocks.map((block) => (
                          <li key={block.id} className="min-w-0">
                            {block.contentType === "code" ? (
                              <pre className="max-w-full overflow-x-auto rounded-lg border border-border-ui bg-page p-3 font-mono text-sm text-ink">
                                <code>{block.bodyText}</code>
                              </pre>
                            ) : (
                              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary">
                                {block.bodyText}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                      <menu className="mt-4 flex list-none flex-wrap gap-2 p-0">
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setSubmitErrorMessage(undefined);
                              setSectionModalMode({
                                kind: "edit",
                                sectionId: section.id,
                              });
                            }}
                            className="rounded-lg border border-ink bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-page"
                          >
                            Edit Section
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              void handleDeleteSection(section.id);
                            }}
                            className="rounded-lg border border-coral/40 bg-surface px-3 py-2 text-sm font-semibold text-coral hover:bg-coral/10"
                          >
                            Delete
                          </button>
                        </li>
                      </menu>
                    </section>
                  ) : undefined}
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {sectionModalMode.kind === "create" ? (
        <LearningContentFormModal
          isSubmitting={isSubmitting}
          submitErrorMessage={submitErrorMessage}
          onClose={() => {
            if (isSubmitting === false) {
              setSectionModalMode({ kind: "closed" });
            }
          }}
          onSave={handleSaveSection}
        />
      ) : undefined}

      {sectionModalMode.kind === "edit" && editingSection !== undefined ? (
        <LearningContentFormModal
          initialSection={editingSection}
          isSubmitting={isSubmitting}
          submitErrorMessage={submitErrorMessage}
          onClose={() => {
            if (isSubmitting === false) {
              setSectionModalMode({ kind: "closed" });
            }
          }}
          onSave={handleSaveSection}
        />
      ) : undefined}
    </section>
  );
}
