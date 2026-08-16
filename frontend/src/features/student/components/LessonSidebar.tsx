import type { LessonUnit, LessonViewMode } from "../types";

const lessonViewModes: { id: LessonViewMode; label: string }[] = [
  { id: "sub-tabs", label: "Sub-tabs" },
  { id: "full-page", label: "Full page" },
];

type LessonSidebarProps = {
  units: LessonUnit[];
  selectedUnitId: string;
  lessonViewMode: LessonViewMode;
  onSelectViewMode: (lessonViewMode: LessonViewMode) => void;
  onSelectUnit: (unitId: string) => void;
};

export function LessonSidebar({
  units,
  selectedUnitId,
  lessonViewMode,
  onSelectViewMode,
  onSelectUnit,
}: LessonSidebarProps) {
  return (
    <aside className="min-w-0 rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)] lg:sticky lg:top-6 lg:self-start">
      <h2 className="text-sm font-bold tracking-tight text-ink">
        Lesson navigation
      </h2>

      <nav aria-label="Lesson view" className="mt-4">
        <ul className="grid grid-cols-2 gap-2">
          {lessonViewModes.map((viewMode) => {
            const isSelected = viewMode.id === lessonViewMode;

            return (
              <li key={viewMode.id}>
                <button
                  type="button"
                  onClick={() => onSelectViewMode(viewMode.id)}
                  aria-current={isSelected ? "true" : undefined}
                  className={
                    isSelected
                      ? "w-full rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white"
                      : "w-full rounded-lg border border-border-ui bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:bg-page"
                  }
                >
                  {viewMode.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav aria-label="Lesson units" className="mt-6">
        <ul className="flex flex-col gap-1">
          {units.map((unit) => {
            const isSelected = unit.id === selectedUnitId;

            return (
              <li key={unit.id}>
                <button
                  type="button"
                  onClick={() => onSelectUnit(unit.id)}
                  aria-current={isSelected ? "true" : undefined}
                  className={
                    isSelected
                    ? "w-full break-words rounded-lg bg-ink px-3 py-2 text-left text-sm font-semibold text-white"
                    : "w-full break-words rounded-lg px-3 py-2 text-left text-sm font-medium text-text-secondary hover:bg-page"
                  }
                >
                  {unit.title}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
