"use client";

import { useState } from "react";
import type { LearningContentSection } from "../types";
import { LearningContentFormModal } from "./LearningContentFormModal";

type LearningContentTabProps = {
  courseTitle: string;
  learningContentSections: LearningContentSection[];
};

type SectionModalMode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; sectionId: string };

export function LearningContentTab({
  courseTitle,
  learningContentSections,
}: LearningContentTabProps) {
  const [expandedSectionId, setExpandedSectionId] = useState<
    string | undefined
  >(learningContentSections[0]?.id);
  const [sectionModalMode, setSectionModalMode] = useState<SectionModalMode>({
    kind: "closed",
  });
  const [localSections, setLocalSections] = useState(learningContentSections);

  const editingSection =
    sectionModalMode.kind === "edit"
      ? localSections.find(
          (section) => section.id === sectionModalMode.sectionId,
        )
      : undefined;

  return (
    <section aria-labelledby="learning-content-heading" className="mt-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="learning-content-heading"
          className="text-xl font-bold tracking-tight text-ink"
        >
          Learning content for {courseTitle}
        </h2>
        <button
          type="button"
          onClick={() => setSectionModalMode({ kind: "create" })}
          className="rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:brightness-[0.97]"
        >
          + Add Section
        </button>
      </header>

      {localSections.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          No learning sections yet. Add a section to get started.
        </p>
      ) : (
        <ul className="mt-4 flex list-none flex-col gap-3 p-0">
          {localSections.map((section) => {
            const isExpanded = expandedSectionId === section.id;

            return (
              <li key={section.id}>
                <article className="rounded-2xl border border-border-ui bg-surface shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
                    onClick={() =>
                      setExpandedSectionId(
                        isExpanded ? undefined : section.id,
                      )
                    }
                    aria-expanded={isExpanded}
                  >
                    <span className="min-w-0">
                      <span className="block text-base font-bold text-ink">
                        {section.title}
                      </span>
                      {isExpanded === false ? (
                        <span className="mt-1 line-clamp-2 block text-sm text-text-secondary">
                          {section.content}
                        </span>
                      ) : undefined}
                    </span>
                    <span className="text-sm font-semibold text-text-secondary">
                      {isExpanded ? "▴" : "▾"}
                    </span>
                  </button>

                  {isExpanded ? (
                    <section className="border-t border-border-ui px-5 py-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                        {section.content}
                      </p>
                      <menu className="mt-4 flex list-none gap-2 p-0">
                        <li>
                          <button
                            type="button"
                            onClick={() =>
                              setSectionModalMode({
                                kind: "edit",
                                sectionId: section.id,
                              })
                            }
                            className="rounded-lg border border-ink bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-page"
                          >
                            Edit Section
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
          onClose={() => setSectionModalMode({ kind: "closed" })}
          onSave={(formValues) => {
            const newSection: LearningContentSection = {
              id: `section-${localSections.length + 1}`,
              title: formValues.title,
              content: formValues.content,
            };
            setLocalSections((previousSections) => [
              ...previousSections,
              newSection,
            ]);
            setExpandedSectionId(newSection.id);
            setSectionModalMode({ kind: "closed" });
          }}
        />
      ) : undefined}

      {sectionModalMode.kind === "edit" && editingSection !== undefined ? (
        <LearningContentFormModal
          initialSection={editingSection}
          onClose={() => setSectionModalMode({ kind: "closed" })}
          onSave={(formValues) => {
            setLocalSections((previousSections) =>
              previousSections.map((section) => {
                if (section.id !== editingSection.id) {
                  return section;
                }

                return {
                  ...section,
                  title: formValues.title,
                  content: formValues.content,
                };
              }),
            );
            setSectionModalMode({ kind: "closed" });
          }}
        />
      ) : undefined}
    </section>
  );
}
