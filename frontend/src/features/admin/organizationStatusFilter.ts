import type { CompanyStatus, DirectoryOrganization } from "./types";
import { itemsMatchingStatusAndSearch } from "./statusFilter";

export type OrganizationStatusFilter = "all" | CompanyStatus;

export const organizationStatusFilters: {
  id: OrganizationStatusFilter;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Suspended" },
];

export function sortOrganizations(
  organizations: DirectoryOrganization[],
): DirectoryOrganization[] {
  return [...organizations].sort((left, right) => {
    if (left.status !== right.status) {
      if (left.status === "active") {
        return -1;
      }
      return 1;
    }
    return left.name.localeCompare(right.name);
  });
}

export function visibleOrganizationsForFilter(
  organizations: DirectoryOrganization[],
  statusFilter: OrganizationStatusFilter,
  searchQuery = "",
): DirectoryOrganization[] {
  return itemsMatchingStatusAndSearch(
    sortOrganizations(organizations),
    statusFilter,
    searchQuery,
    (organization) => organization.status,
    (organization) => [organization.name, organization.slug],
  );
}

export function emptyOrganizationsMessage(
  statusFilter: OrganizationStatusFilter,
  searchQuery: string,
): string {
  if (searchQuery.trim() !== "") {
    return "No organisations match your search.";
  }
  if (statusFilter === "active") {
    return "No active organisations.";
  }
  if (statusFilter === "suspended") {
    return "No suspended organisations.";
  }
  return "No organisations.";
}
