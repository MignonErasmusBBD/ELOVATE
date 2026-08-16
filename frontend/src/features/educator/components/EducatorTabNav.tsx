import type { EducatorTabId } from "../types";

const educatorTabs: { id: EducatorTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "practice-insights", label: "Practice Insights" },
  { id: "students", label: "Students" },
  { id: "questions", label: "Questions" },
  { id: "learning-content", label: "Learning Content" },
];

type EducatorTabNavProps = {
  selectedTabId: EducatorTabId;
  onSelectTab: (tabId: EducatorTabId) => void;
};

export function EducatorTabNav({
  selectedTabId,
  onSelectTab,
}: EducatorTabNavProps) {
  return (
    <nav aria-label="Educator dashboard sections" className="border-b border-border-ui">
      <ul className="flex list-none flex-wrap gap-1 p-0">
        {educatorTabs.map((tab) => {
          const isSelected = tab.id === selectedTabId;

          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onSelectTab(tab.id)}
                aria-current={isSelected ? "true" : undefined}
                className={
                  isSelected
                    ? "border-b-2 border-ink px-4 py-3 text-sm font-semibold text-ink"
                    : "border-b-2 border-transparent px-4 py-3 text-sm font-medium text-text-secondary hover:text-ink"
                }
              >
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
