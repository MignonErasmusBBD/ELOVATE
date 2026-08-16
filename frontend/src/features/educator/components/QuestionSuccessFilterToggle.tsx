export type QuestionSuccessFilterId = "all" | "needs-revision" | "high-success";

type QuestionSuccessFilterToggleProps = {
  selectedFilterId: QuestionSuccessFilterId;
  onSelectFilter: (filterId: QuestionSuccessFilterId) => void;
};

const filterOptions: {
  id: QuestionSuccessFilterId;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "needs-revision", label: "Needs revision" },
  { id: "high-success", label: "High success" },
];

export function QuestionSuccessFilterToggle({
  selectedFilterId,
  onSelectFilter,
}: QuestionSuccessFilterToggleProps) {
  return (
    <fieldset className="mt-4 max-w-2xl border-0 p-0">
      <legend className="sr-only">Question success rate filter</legend>
      <span
        className="inline-flex w-full rounded-lg border border-ink bg-page p-1"
        role="presentation"
      >
        {filterOptions.map((option) => {
          const isSelected = option.id === selectedFilterId;

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectFilter(option.id)}
              className={
                isSelected
                  ? "flex flex-1 items-center justify-center rounded-lg bg-ink px-3 py-2.5 text-sm font-semibold text-white"
                  : "flex flex-1 items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-ink"
              }
            >
              {option.label}
            </button>
          );
        })}
      </span>
    </fieldset>
  );
}
