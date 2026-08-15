import { matchesSearchQuery } from "@/helpers/search";

export type StatusFilter<TStatus extends string> = "all" | TStatus;

export type StatusFilterOption<TFilter extends string> = {
  id: TFilter;
  label: string;
};

export function itemsMatchingStatusAndSearch<TItem, TStatus extends string>(
  items: TItem[],
  statusFilter: StatusFilter<TStatus>,
  searchQuery: string,
  itemStatus: (item: TItem) => TStatus,
  searchableValues: (item: TItem) => string[],
): TItem[] {
  return items.filter((item) => {
    if (statusFilter !== "all" && itemStatus(item) !== statusFilter) {
      return false;
    }

    return searchableValues(item).some((value) =>
      matchesSearchQuery(value, searchQuery),
    );
  });
}

export function emptyStatusFilterMessage(
  statusFilter: string,
  searchQuery: string,
  noun: string,
): string {
  if (searchQuery.trim() !== "") {
    return `No ${noun} match your search.`;
  }
  if (statusFilter === "all") {
    return `No ${noun}.`;
  }
  return `No ${statusFilter} ${noun}.`;
}
