"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SkipForwardIcon } from "@/components/icons/SkipForwardIcon";
import { VolumeIcon } from "@/components/icons/VolumeIcon";
import { ElovateApiError, errorMessageFromUnknown } from "@/helpers/elovateApi";
import { getCourse } from "@/helpers/coursesApi";
import { PAGE_SHELL_CLASS } from "@/helpers/pageLayout";
import { recordContentView } from "@/helpers/contentViewApi";
import {
  listLearningContentSections,
  type LearningContentSection,
} from "@/helpers/learningContentApi";
import {
  DEFAULT_LESSON_READING_PREFS,
  readLessonReadingPrefs,
  writeLessonReadingPrefs,
  type LessonContrast,
  type LessonReadingPrefs,
  type LessonTextSize,
} from "@/helpers/lessonReadingPrefs";
import type { LessonUnit, LessonViewMode } from "../types";
import { LessonReadingToolbar } from "./LessonReadingToolbar";
import { LessonSidebar } from "./LessonSidebar";
import { LessonUnitBody } from "./LessonUnitBody";

type LessonPageProps = Readonly<{
  courseId: string;
}>;

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
    return units.map(unitSpeechText).join(". ");
  }
  if (selectedUnit === undefined) {
    return "";
  }
  return unitSpeechText(selectedUnit);
}

function unitSpeechText(unit: LessonUnit): string {
  const parts = [unit.title, ...unit.paragraphs];
  if (unit.codeSample !== undefined && unit.codeSample !== "") {
    parts.push(`Code example. ${unit.codeSample}`);
  }
  return parts.join(". ");
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  const [readingPrefs, setReadingPrefs] = useState<LessonReadingPrefs>(
    DEFAULT_LESSON_READING_PREFS,
  );
  const viewSessionRef = useRef<{ sectionId: string; startedAt: number } | undefined>(undefined);
  const contentHeadingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusContentRef = useRef(false);

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

  useEffect(() => {
    setReadingPrefs(readLessonReadingPrefs());
  }, []);

  // Flush elapsed time for the previous section, then start tracking the new one.
  useEffect(() => {
    if (isLoading || selectedUnitId === "") return;
    const prev = viewSessionRef.current;
    if (prev !== undefined && prev.sectionId !== selectedUnitId) {
      const durationSeconds = Math.round((Date.now() - prev.startedAt) / 1000);
      if (durationSeconds >= 1) {
        recordContentView(courseId, prev.sectionId, durationSeconds).catch(() => {});
      }
    }
    if (prev === undefined || prev.sectionId !== selectedUnitId) {
      viewSessionRef.current = { sectionId: selectedUnitId, startedAt: Date.now() };
    }
  }, [selectedUnitId, isLoading, courseId]);

  // Flush the active session when the student leaves the lesson page.
  useEffect(() => {
    return () => {
      const session = viewSessionRef.current;
      if (session !== undefined) {
        const durationSeconds = Math.round((Date.now() - session.startedAt) / 1000);
        if (durationSeconds >= 1) {
          recordContentView(courseId, session.sectionId, durationSeconds).catch(() => {});
        }
      }
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
    if (lessonViewMode !== "full-page") {
      return;
    }
    const el = document.getElementById(getUnitSectionId(selectedUnitId));
    if (el === null) {
      return;
    }
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }, [lessonViewMode, selectedUnitId]);

  useEffect(() => {
    if (shouldFocusContentRef.current === false) {
      return;
    }
    shouldFocusContentRef.current = false;
    if (lessonViewMode === "full-page") {
      const heading = document.getElementById(
        `${getUnitSectionId(selectedUnitId)}-heading`,
      );
      if (heading instanceof HTMLElement) {
        heading.focus();
        return;
      }
    }
    const contentHeading = contentHeadingRef.current;
    if (contentHeading !== null) {
      contentHeading.focus();
    }
  }, [lessonViewMode, selectedUnitId]);

  function goToUnit(unitId: string) {
    shouldFocusContentRef.current = true;
    setSelectedUnitId(unitId);
  }

  function updateReadingPrefs(nextPrefs: LessonReadingPrefs) {
    setReadingPrefs(nextPrefs);
    writeLessonReadingPrefs(nextPrefs);
  }

  function handleToggleSpeech() {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = buildSpeechText(units, selectedUnit, lessonViewMode);
    if (text === "") {
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  if (isLoading) {
    return (
      <section className={PAGE_SHELL_CLASS}>
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
      <section className={PAGE_SHELL_CLASS}>
        <div className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)] sm:p-8">
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
      <section className={PAGE_SHELL_CLASS}>
        <p className="text-text-secondary">
          This course has no lesson content yet.
        </p>
      </section>
    );
  }

  return (
    <section className={`${PAGE_SHELL_CLASS} grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8`}>
      <LessonSidebar
        units={units}
        selectedUnitId={selectedUnitId}
        lessonViewMode={lessonViewMode}
        onSelectViewMode={setLessonViewMode}
        onSelectUnit={goToUnit}
      />

      <section
        className="lesson-reading relative flex min-w-0 flex-col gap-4"
        data-reading-size={readingPrefs.textSize}
        data-reading-contrast={readingPrefs.contrast}
      >
        <nav aria-label="Skip links" className="absolute">
          <a href="#lesson-content" className="skip-link">
            Skip to lesson content
          </a>
          {nextUnit === undefined ? undefined : (
            <button
              type="button"
              className="skip-link skip-link-next"
              onClick={() => goToUnit(nextUnit.id)}
            >
              Skip to next unit: {nextUnit.title}
            </button>
          )}
        </nav>

        <LessonReadingToolbar
          textSize={readingPrefs.textSize}
          contrast={readingPrefs.contrast}
          onTextSizeChange={(textSize: LessonTextSize) =>
            updateReadingPrefs({ ...readingPrefs, textSize })
          }
          onContrastChange={(contrast: LessonContrast) =>
            updateReadingPrefs({ ...readingPrefs, contrast })
          }
        />

        <p className="sr-only" aria-live="polite">
          Now reading {selectedUnit.title}, unit {selectedUnitIndex + 1} of{" "}
          {units.length}.
        </p>

        <article
          id="lesson-content"
          tabIndex={-1}
          className="lesson-reading-surface min-w-0 overflow-hidden rounded-2xl border p-4 shadow-[0_8px_24px_rgba(30,27,51,0.06)] sm:p-6 md:p-8"
        >
          <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <section className="min-w-0">
              <h1
                ref={contentHeadingRef}
                tabIndex={-1}
                className="lesson-reading-title break-words font-bold tracking-tight"
              >
                {lessonViewMode === "sub-tabs"
                  ? selectedUnit.title
                  : "Lesson content"}
              </h1>
              {lessonViewMode === "sub-tabs" ? (
                <p className="lesson-reading-muted mt-2 text-sm">
                  Unit {selectedUnitIndex + 1} of {units.length}
                </p>
              ) : (
                <p className="lesson-reading-muted mt-2 text-sm">
                  Full lesson view
                </p>
              )}
            </section>
            <menu className="m-0 flex list-none flex-col items-stretch gap-2 p-0 sm:items-end">
              {courseStatus === "deactivated" ? undefined : (
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
                  aria-pressed={isSpeaking}
                  aria-label={
                    isSpeaking
                      ? "Stop reading the lesson aloud"
                      : "Listen to the lesson"
                  }
                  className={
                    isSpeaking
                      ? "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 sm:w-auto"
                      : "lesson-reading-action inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold hover:brightness-110 sm:w-auto"
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
                  aria-label={
                    previousUnit === undefined
                      ? "No previous unit"
                      : `Back to ${previousUnit.title}`
                  }
                  onClick={() => {
                    if (previousUnit === undefined) {
                      return;
                    }
                    goToUnit(previousUnit.id);
                  }}
                  className="lesson-reading-action-secondary rounded-lg px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={nextUnit === undefined}
                  aria-label={
                    nextUnit === undefined
                      ? "No next unit"
                      : `Next unit: ${nextUnit.title}`
                  }
                  onClick={() => {
                    if (nextUnit === undefined) {
                      return;
                    }
                    goToUnit(nextUnit.id);
                  }}
                  className="lesson-reading-action rounded-lg px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
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
                    tabIndex={-1}
                    className="break-words text-xl font-bold tracking-tight"
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
    </section>
  );
}
