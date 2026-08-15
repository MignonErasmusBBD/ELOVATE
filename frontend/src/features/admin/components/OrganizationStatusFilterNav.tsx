import type { OrganizationStatusFilter } from "../organizationStatusFilter";
import { organizationStatusFilters } from "../organizationStatusFilter";
import { StatusFilterNav } from "./StatusFilterNav";

type OrganizationStatusFilterNavProps = Readonly<{
  selectedFilter: OrganizationStatusFilter;
  onSelectFilter: (filter: OrganizationStatusFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (searchQuery: string) => void;
  searchInputId: string;
}>;

export function OrganizationStatusFilterNav({
  selectedFilter,
  onSelectFilter,
  searchQuery,
  onSearchQueryChange,
  searchInputId,
}: OrganizationStatusFilterNavProps) {
  return (
    <StatusFilterNav
      ariaLabel="Organisation status"
      filters={organizationStatusFilters}
      selectedFilter={selectedFilter}
      onSelectFilter={onSelectFilter}
      searchQuery={searchQuery}
      onSearchQueryChange={onSearchQueryChange}
      searchInputId={searchInputId}
      searchLabel="Search organisations"
      searchPlaceholder="Search organisations"
    />
  );
}
