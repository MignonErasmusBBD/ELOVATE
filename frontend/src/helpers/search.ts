export function matchesSearchQuery(
  haystack: string,
  searchQuery: string,
): boolean {
  const normalisedQuery = searchQuery.trim().toLowerCase();

  if (normalisedQuery === "") {
    return true;
  }

  return haystack.toLowerCase().includes(normalisedQuery);
}

export function itemsMatchingSearch<TItem>(
  items: TItem[],
  searchQuery: string,
  searchableValues: (item: TItem) => string[],
): TItem[] {
  return items.filter((item) =>
    searchableValues(item).some((value) =>
      matchesSearchQuery(value, searchQuery),
    ),
  );
}
