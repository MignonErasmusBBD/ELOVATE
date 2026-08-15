"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SkipForwardIcon } from "@/components/icons/SkipForwardIcon";
import { VolumeIcon } from "@/components/icons/VolumeIcon";
import { ElovateApiError, errorMessageFromUnknown } from "@/helpers/elovateApi";
import { getCourse } from "@/helpers/coursesApi";
import {
  listLearningContentSections,
  type LearningContentSection,
} from "@/helpers/learningContentApi";
import type { LessonUnit, LessonViewMode } from "../types";
import { LessonSidebar } from "./LessonSidebar";
import { LessonUnitBody } from "./LessonUnitBody";

type LessonPageProps = {
  courseId: string;
};

function sectionToUnit(section: LearningContentSection): LessonUnit {
  const sorted = [...section.contentBlocks].sort(
    (a, b) => a.position - b.position,
  );
  const paragraphs = sorted
    .filter((b) => b.contentType === "text")
    .map((b) => b.bodyText);
  const codeBlock = sorted.find((b) => b.contentType === "code");
  return {
    id: section.id,
    title: section.title,
    paragraphs,
    codeSample: codeBlock?.bodyText,
  };
}

function getUnitSectionId(unitId: string) {
  return `lesson-unit-${unitId}`;
}

function buildSpeechText(
  units: LessonUnit[],
  selectedUnit: LessonUnit | undefined,
  viewMode: LessonViewMode,
): string {
  if (viewMode === "full-page") {
    return units
      .map((u) => `${u.title}. ${u.paragraphs.join(" ")}`)
      .join(". ");
  }
  if (selectedUnit === undefined) return "";
  return `${selectedUnit.title}. ${selectedUnit.paragraphs.join(" ")}`;
}

export function LessonPage({ courseId }: LessonPageProps) {
  const [sections, setSections] = useState<LearningContentSection[]>([]);
  const [courseStatus, setCourseStatus] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [lessonViewMode, setLessonViewMode] =
    useState<LessonViewMode>("sub-tabs");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage(undefined);

    Promise.all([
      getCourse(courseId),
      listLearningContentSections(courseId),
    ])
      .then(([course, loaded]) => {
        if (cancelled) return;
        setCourseStatus(course?.status);
        const sorted = [...loaded].sort((a, b) => a.position - b.position);
        setSections(sorted);
        if (sorted[0] !== undefined) {
          setSelectedUnitId(sorted[0].id);
        }
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ElovateApiError) {
          setErrorStatus(error.statusCode);
        }
        setErrorMessage(
          errorMessageFromUnknown(error, "Could not load course content."),
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  // Cancel any in-progress speech when the user navigates to a different unit or view
  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [selectedUnitId, lessonViewMode]);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const units = sections.map(sectionToUnit);
  const selectedUnit = units.find((u) => u.id === selectedUnitId);
  const selectedUnitIndex = units.findIndex((u) => u.id === selectedUnitId);
  const previousUnit =
    selectedUnitIndex > 0 ? units[selectedUnitIndex - 1] : undefined;
  const nextUnit = units[selectedUnitIndex + 1];

  useEffect(() => {
    if (lessonViewMode !== "full-page") return;
    const el = document.getElementById(getUnitSectionId(selectedUnitId));
    if (el === null) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [lessonViewMode, selectedUnitId]);

  function handleToggleSpeech() {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = buildSpeechText(units, selectedUnit, lessonViewMode);
    if (text === "") return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
        <p className="text-text-secondary">Loading lesson content…</p>
      </section>
    );
  }

  if (errorMessage !== undefined) {
    const heading =
      errorStatus === 404
        ? "Course not found"
        : errorStatus === 403
          ? "Access denied"
          : "Something went wrong";
    const detail =
      errorStatus === 404
        ? "This course doesn't exist. Check the URL or go back to the course list."
        : errorStatus === 403
          ? "You don't have access to this course. Make sure you're enrolled before trying again."
          : errorMessage;

    return (
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
        <div className="rounded-2xl border border-border-ui bg-surface p-8 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {heading}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">{detail}</p>
          <Link
            href="/courses"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            Back to courses
          </Link>
        </div>
      </section>
    );
  }

  if (units.length === 0 || selectedUnit === undefined) {
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
            {courseStatus !== "deactivated" && (
              <li>
                <Link
                  href={`/student/courses/${courseId}/quiz`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:brightness-[0.97] sm:w-auto"
                >
                  <SkipForwardIcon className="h-4 w-4" />
                  Skip to Quiz
                </Link>
              </li>
            )}
            <li>
              <button
                type="button"
                onClick={handleToggleSpeech}
                className={
                  isSpeaking
                    ? "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 sm:w-auto"
                    : "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 sm:w-auto"
                }
              >
                <VolumeIcon className="h-4 w-4" />
                {isSpeaking ? "Stop" : "Listen"}
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
                  if (previousUnit === undefined) return;
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
                  if (nextUnit === undefined) return;
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
