import { ExplainTip } from "@/components/ui/ExplainTip";
import { explainCopy } from "@/helpers/explainCopy";
import type { EducatorCourseVisibility } from "../types";

type CourseVisibilityToggleProps = {
  selectedVisibility: EducatorCourseVisibility;
  onSelectVisibility: (visibility: EducatorCourseVisibility) => void;
};

const visibilityOptions: {
  id: EducatorCourseVisibility;
  label: string;
}[] = [
  { id: "community", label: "Community" },
  { id: "private", label: "Organisation" },
];

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
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

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function CourseVisibilityToggle({
  selectedVisibility,
  onSelectVisibility,
}: CourseVisibilityToggleProps) {
  return (
    <fieldset className="flex max-w-lg items-center gap-2 border-0 p-0">
      <legend className="sr-only">Course visibility filter</legend>
      <span
        className="inline-flex min-w-0 flex-1 rounded-lg border border-ink bg-page p-1"
        role="presentation"
      >
        {visibilityOptions.map((option) => {
          const isSelected = option.id === selectedVisibility;

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectVisibility(option.id)}
              className={
                isSelected
                  ? "flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
                  : "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-text-secondary hover:text-ink sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
              }
            >
              {option.id === "community" ? <GlobeIcon /> : <LockIcon />}
              {option.label}
            </button>
          );
        })}
      </span>
      <ExplainTip label="About community and organisation courses">
        {explainCopy.visibilityCommunity} {explainCopy.visibilityOrganisation}
      </ExplainTip>
    </fieldset>
  );
}
