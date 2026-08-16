import type { CourseFilter } from "../types";

type CourseFilterBarProps = {
  selected: CourseFilter;
  hasOrg: boolean;
  onSelect: (filter: CourseFilter) => void;
};

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

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
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

function BookmarkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path d="M5 3h14a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function CourseFilterBar({
  selected,
  hasOrg,
  onSelect,
}: CourseFilterBarProps) {
  const filterOptions: { id: CourseFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "community", label: "Community" },
    ...(hasOrg ? [{ id: "organisation" as CourseFilter, label: "Organisation" }] : []),
    { id: "enrolled", label: "My courses" },
  ];

  return (
    <fieldset className="w-full min-w-0 border-0 p-0">
      <legend className="sr-only">Course filter</legend>
      <span
        className="flex w-full min-w-0 flex-wrap rounded-lg border border-ink bg-page p-1 sm:inline-flex sm:w-auto sm:flex-nowrap"
        role="presentation"
      >
        {filterOptions.map((option) => {
          const isSelected = option.id === selected;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(option.id)}
              className={
                isSelected
                  ? "flex min-w-0 flex-1 basis-1/2 items-center justify-center gap-1.5 rounded-lg bg-ink px-2 py-2 text-xs font-semibold text-white sm:flex-none sm:basis-auto sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
                  : "flex min-w-0 flex-1 basis-1/2 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-text-secondary hover:text-ink sm:flex-none sm:basis-auto sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
              }
            >
              {option.id === "community" ? (
                <span className="hidden sm:inline-flex">
                  <GlobeIcon />
                </span>
              ) : undefined}
              {option.id === "organisation" ? (
                <span className="hidden sm:inline-flex">
                  <BuildingIcon />
                </span>
              ) : undefined}
              {option.id === "enrolled" ? (
                <span className="hidden sm:inline-flex">
                  <BookmarkIcon />
                </span>
              ) : undefined}
              {option.label}
            </button>
          );
        })}
      </span>
    </fieldset>
  );
}
