import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { StatusFilterOption } from "../statusFilter";

type StatusFilterNavProps<TFilter extends string> = Readonly<{
  ariaLabel: string;
  filters: StatusFilterOption<TFilter>[];
  selectedFilter: TFilter;
  onSelectFilter: (filter: TFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (searchQuery: string) => void;
  searchInputId: string;
  searchLabel: string;
  searchPlaceholder: string;
}>;

export function StatusFilterNav<TFilter extends string>({
  ariaLabel,
  filters,
  selectedFilter,
  onSelectFilter,
  searchQuery,
  onSearchQueryChange,
  searchInputId,
  searchLabel,
  searchPlaceholder,
}: StatusFilterNavProps<TFilter>) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label={ariaLabel}>
        <ul className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isSelected = filter.id === selectedFilter;

            return (
              <li key={filter.id}>
                <button
                  type="button"
                  onClick={() => onSelectFilter(filter.id)}
                  aria-current={isSelected ? "true" : undefined}
                  className={
                    isSelected
                      ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                      : "rounded-full border border-border-ui bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:bg-page"
                  }
                >
                  {filter.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="sm:w-72">
        <Label htmlFor={searchInputId} className="sr-only">
          {searchLabel}
        </Label>
        <Input
          id={searchInputId}
          type="search"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(changeEvent) =>
            onSearchQueryChange(changeEvent.target.value)
          }
        />
      </div>
    </div>
  );
}
