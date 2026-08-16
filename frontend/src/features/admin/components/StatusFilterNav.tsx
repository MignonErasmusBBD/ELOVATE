import { SearchField } from "@/components/ui/SearchField";
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
    <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      <SearchField
        id={searchInputId}
        label={searchLabel}
        placeholder={searchPlaceholder}
        value={searchQuery}
        onChange={onSearchQueryChange}
      />
    </section>
  );
}
