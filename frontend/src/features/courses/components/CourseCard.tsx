"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import {
  courseCardUrgencyClassName,
  dueDateLabel,
  dueUrgency,
  dueUrgencyClassName,
} from "@/helpers/johannesburgDate";
import type { CourseIconName } from "../types";
import { CourseIcon } from "./CourseIcon";

type CourseCardProps = {
  id: string;
  title: string;
  description?: string;
  visibility: string;
  status: string;
  isRequired?: boolean;
  dueAt?: string;
  iconName?: CourseIconName;
  onEnrol?: () => Promise<void>;
};

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9s1.3-6.2 3.8-9Z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M3 9h6M3 15h6M12 9h9M12 15h9" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </svg>
  );
}

const courseIcons: CourseIconName[] = [
  "eye",
  "gitBranch",
  "layers",
  "code",
  "server",
  "checkCircle",
];

function pickIcon(id: string): CourseIconName {
  const char = id.replace(/-/g, "")[0] ?? "0";
  const index = parseInt(char, 16) % courseIcons.length;
  return courseIcons[index] ?? "layers";
}

const TRUNCATE_AT = 150;

function CourseRequirementTags({
  isRequired,
  dueAt,
}: Readonly<{
  isRequired: boolean;
  dueAt: string | undefined;
}>) {
  const urgency = dueAt === undefined ? undefined : dueUrgency(dueAt);
  if (isRequired === false && dueAt === undefined) {
    return undefined;
  }
  return (
    <ul className="m-0 flex min-w-0 list-none flex-wrap justify-end gap-1.5 p-0">
      {isRequired ? (
        <li>
          <span className="inline-flex items-center rounded-full border-2 border-red-500 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
            Required
          </span>
        </li>
      ) : undefined}
      {dueAt === undefined || urgency === undefined ? undefined : (
        <li>
          <span
            className={`inline-flex items-center rounded-full border-2 px-2 py-0.5 text-xs font-semibold ${dueUrgencyClassName(urgency)}`}
          >
            {dueDateLabel(dueAt)}
          </span>
        </li>
      )}
    </ul>
  );
}

export function CourseCard({
  id,
  title,
  description,
  visibility,
  status,
  isRequired = false,
  dueAt,
  iconName,
  onEnrol,
}: CourseCardProps) {
  const isArchived = status === "deactivated";
  const resolvedIcon = iconName ?? pickIcon(id);
  const isLong = description !== undefined && description.length > TRUNCATE_AT;
  const [expanded, setExpanded] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const urgency = dueAt === undefined ? undefined : dueUrgency(dueAt);
  const cardBorderClass =
    urgency === undefined
      ? "border-2 border-border-ui"
      : `border-[3px] ${courseCardUrgencyClassName(urgency)}`;

  async function handleEnrolClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (onEnrol === undefined || isEnrolling) return;
    setIsEnrolling(true);
    try {
      await onEnrol();
    } finally {
      setIsEnrolling(false);
    }
  }

  return (
    <article
      className={`flex h-full min-w-0 flex-col rounded-2xl bg-surface p-4 shadow-[0_8px_24px_rgba(30,27,51,0.06)] transition-shadow hover:shadow-[0_12px_32px_rgba(30,27,51,0.1)] sm:p-6 ${cardBorderClass}`}
    >
      <header className="flex items-start justify-between gap-3">
        <figure className="m-0 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-coral text-white">
          <CourseIcon iconName={resolvedIcon} className="h-5 w-5" />
        </figure>
        <CourseRequirementTags isRequired={isRequired} dueAt={dueAt} />
      </header>
      <h2 className="mt-4 break-words text-lg font-bold tracking-tight text-ink">
        {title}
      </h2>

      {/* Always present so footer stays at the bottom even with no description */}
      <section className="mt-2 flex-1">
        {description !== undefined && (
          <>
            <p
              className={`break-words text-sm leading-relaxed text-text-secondary ${isLong && !expanded ? "line-clamp-3" : ""}`}
            >
              {description}
            </p>
            {isLong && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExpanded((prev) => !prev);
                }}
                className="mt-1 text-xs font-semibold text-coral hover:underline"
              >
                {expanded ? "Read less" : "Read more"}
              </button>
            )}
          </>
        )}
      </section>

      <footer className="mt-5 flex flex-wrap items-center gap-2">
        {visibility === "community" && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border-ui px-2 py-0.5 text-xs font-medium text-text-secondary">
            <GlobeIcon />
            Community
          </span>
        )}
        {visibility === "private" && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border-ui px-2 py-0.5 text-xs font-medium text-text-secondary">
            <BuildingIcon />
            Organisation
          </span>
        )}
        {isArchived && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border-ui bg-surface px-2 py-0.5 text-xs font-medium text-text-secondary">
            <ArchiveIcon />
            Archived
          </span>
        )}
      </footer>
      {onEnrol !== undefined ? (
        <button
          type="button"
          disabled={isEnrolling}
          onClick={handleEnrolClick}
          className="mt-4 inline-flex items-center gap-2 text-left text-sm font-semibold text-coral hover:underline disabled:opacity-60"
        >
          {isEnrolling ? <Spinner className="size-4" /> : undefined}
          {isEnrolling ? "Enrolling…" : "Enrol →"}
        </button>
      ) : (
        <p className="mt-4 text-sm font-semibold text-coral">
          {isArchived ? "View course (read-only) →" : "View course →"}
        </p>
      )}
    </article>
  );
}
