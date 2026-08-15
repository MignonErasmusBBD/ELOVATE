"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SkipForwardIcon } from "@/components/icons/SkipForwardIcon";
import { VolumeIcon } from "@/components/icons/VolumeIcon";
import type { Course } from "@/features/courses/types";
import { getLessonUnits } from "../data/lessons";
import type { LessonViewMode } from "../types";
import { LessonSidebar } from "./LessonSidebar";
import { LessonUnitBody } from "./LessonUnitBody";

type LessonPageProps = {
  course: Course;
};

function getUnitSectionId(unitId: string) {
  return `lesson-unit-${unitId}`;
}

export function LessonPage({ course }: LessonPageProps) {
  const units = getLessonUnits(course.title);
  const firstUnit = units[0];
  const [lessonViewMode, setLessonViewMode] =
    useState<LessonViewMode>("sub-tabs");
  const [selectedUnitId, setSelectedUnitId] = useState(
    firstUnit === undefined ? "" : firstUnit.id,
  );

  const selectedUnit = units.find((unit) => unit.id === selectedUnitId);
  const selectedUnitIndex = units.findIndex(
    (unit) => unit.id === selectedUnitId,
  );
  const previousUnit =
    selectedUnitIndex > 0 ? units[selectedUnitIndex - 1] : undefined;
  const nextUnit = units[selectedUnitIndex + 1];

  useEffect(() => {
    if (lessonViewMode !== "full-page") {
      return;
    }

    const selectedSection = document.getElementById(
      getUnitSectionId(selectedUnitId),
    );

    if (selectedSection === null) {
      return;
    }

    selectedSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [lessonViewMode, selectedUnitId]);

  if (firstUnit === undefined || selectedUnit === undefined) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
        <p className="text-text-secondary">
          This course has no lesson content yet.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <LessonSidebar
        units={units}
        selectedUnitId={selectedUnitId}
        lessonViewMode={lessonViewMode}
        onSelectViewMode={setLessonViewMode}
        onSelectUnit={setSelectedUnitId}
      />

      <article className="rounded-2xl border border-border-ui bg-surface p-6 shadow-[0_8px_24px_rgba(30,27,51,0.06)] md:p-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <section className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
              {lessonViewMode === "sub-tabs"
                ? selectedUnit.title
                : "Lesson content"}
            </h1>
            {lessonViewMode === "sub-tabs" ? (
              <p className="mt-2 text-sm text-text-secondary">
                Unit {selectedUnitIndex + 1} of {units.length}
              </p>
            ) : (
              <p className="mt-2 text-sm text-text-secondary">
                Full lesson view
              </p>
            )}
          </section>
          <menu className="m-0 flex list-none flex-col items-stretch gap-2 p-0 sm:items-end">
            <li>
              <Link
                href={`/student/courses/${course.id}/quiz`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:brightness-[0.97] sm:w-auto"
              >
                <SkipForwardIcon className="h-4 w-4" />
                Skip to Quiz
              </Link>
            </li>
            <li>
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 sm:w-auto"
              >
                <VolumeIcon className="h-4 w-4" />
                Listen
              </button>
            </li>
          </menu>
        </header>

        {lessonViewMode === "sub-tabs" ? (
          <>
            <section aria-labelledby="selected-unit-heading" className="mt-8">
              <h2 id="selected-unit-heading" className="sr-only">
                {selectedUnit.title}
              </h2>
              <LessonUnitBody unit={selectedUnit} />
            </section>
            <nav
              aria-label="Unit pagination"
              className="mt-10 flex flex-wrap justify-between gap-3"
            >
              <button
                type="button"
                disabled={previousUnit === undefined}
                onClick={() => {
                  if (previousUnit === undefined) {
                    return;
                  }

                  setSelectedUnitId(previousUnit.id);
                }}
                className="rounded-lg border border-border-ui bg-surface px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={nextUnit === undefined}
                onClick={() => {
                  if (nextUnit === undefined) {
                    return;
                  }

                  setSelectedUnitId(nextUnit.id);
                }}
                className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </>
        ) : (
          <section
            aria-label="All lesson units"
            className="mt-8 flex flex-col gap-10"
          >
            {units.map((unit) => (
              <section
                key={unit.id}
                id={getUnitSectionId(unit.id)}
                aria-labelledby={`${getUnitSectionId(unit.id)}-heading`}
              >
                <h2
                  id={`${getUnitSectionId(unit.id)}-heading`}
                  className="text-xl font-bold tracking-tight text-ink"
                >
                  {unit.title}
                </h2>
                <LessonUnitBody unit={unit} />
              </section>
            ))}
          </section>
        )}
      </article>
    </section>
  );
}
