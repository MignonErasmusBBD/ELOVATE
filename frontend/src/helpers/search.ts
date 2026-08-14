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
