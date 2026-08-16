"use client";

import { useRef, useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { Label } from "@/components/ui/Label";
import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";
import { useActionFeedback } from "@/features/platform";
import { notifyAccountChanged } from "@/helpers/accountEvents";
import { displayRoleName } from "@/helpers/displayLabels";
import { errorMessageFromUnknown } from "@/helpers/elovateApi";
import {
  organisationAdminIds,
  organisationAdminNames,
  peopleAvailableForOrganisationAdmin,
  personSelectOptions,
  withOrganisationAdmin,
  withoutOrganisationMembership,
} from "../parseDirectory";
import {
  addedIds,
  placeUserInOrganisation,
  removeUserFromOrganisation,
  removedIds,
} from "../platformAdminApi";
import type { OrganizationStatusFilter } from "../organizationStatusFilter";
import {
  emptyOrganizationsMessage,
  visibleOrganizationsForFilter,
} from "../organizationStatusFilter";
import type { AdminPerson, DirectoryOrganization, DirectoryRole } from "../types";
import { OrganizationCardHeader } from "./OrganizationCardHeader";
import { OrganizationStatusFilterNav } from "./OrganizationStatusFilterNav";

type OrganisationAdminAssignmentsProps = Readonly<{
  role: DirectoryRole;
  organizations: DirectoryOrganization[];
  people: AdminPerson[];
  currentUserId: string | undefined;
  onDirectoryChanged: () => Promise<void>;
  onPeopleChange: (nextPeople: AdminPerson[]) => void;
  onSavingChange: (isSaving: boolean) => void;
  onError: (message: string | undefined) => void;
}>;

export function OrganisationAdminAssignments({
  role,
  organizations,
  people,
  currentUserId,
  onDirectoryChanged,
  onPeopleChange,
  onSavingChange,
  onError,
}: OrganisationAdminAssignmentsProps) {
  const { showSuccess } = useActionFeedback();
  const saveLock = useRef(false);
  const [statusFilter, setStatusFilter] =
    useState<OrganizationStatusFilter>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const visibleOrganizations = visibleOrganizationsForFilter(
    organizations,
    statusFilter,
    searchQuery,
  );

  async function persistOrganisationAdminChanges(
    organizationId: string,
    previousIds: string[],
    nextIds: string[],
  ) {
    const addedUserIds = addedIds(previousIds, nextIds);
    const removedUserIds = removedIds(previousIds, nextIds);

    if (saveLock.current) {
      return;
    }
    saveLock.current = true;
    onSavingChange(true);
    onError(undefined);
    onPeopleChange(
      withoutOrganisationMembership(
        withOrganisationAdmin(people, organizationId, addedUserIds),
        removedUserIds,
      ),
    );
    try {
      await Promise.all([
        ...addedUserIds.map((userId) =>
          placeUserInOrganisation(organizationId, userId),
        ),
        ...removedUserIds.map((userId) =>
          removeUserFromOrganisation(organizationId, userId),
        ),
      ]);
      if (
        currentUserId !== undefined &&
        (addedUserIds.includes(currentUserId) ||
          removedUserIds.includes(currentUserId))
      ) {
        notifyAccountChanged();
      }
      showSuccess(
        "Org Admin assignments updated. Added people are now in that organisation and can manage its people, private courses, and enrolments.",
      );
    } catch (error) {
      onError(
        errorMessageFromUnknown(
          error,
          "Could not update organisation admin assignments.",
        ),
      );
      await onDirectoryChanged();
    } finally {
      saveLock.current = false;
      onSavingChange(false);
    }
  }

  return (
    <section aria-labelledby="organisation-admin-heading" className="mt-10">
      <header className="mb-5">
        <h3
          id="organisation-admin-heading"
          className="text-lg font-bold text-ink"
        >
          {displayRoleName(role.roleName)}
        </h3>
        {role.description === undefined ? undefined : (
          <p className="mt-1 text-sm text-text-secondary">{role.description}</p>
        )}
      </header>

      {organizations.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Create an organisation first, then assign Org Admin there.
        </p>
      ) : undefined}

      {organizations.length > 0 ? (
        <OrganizationStatusFilterNav
          selectedFilter={statusFilter}
          onSelectFilter={setStatusFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          searchInputId="roles-organization-search"
        />
      ) : undefined}

      {organizations.length > 0 && visibleOrganizations.length === 0 ? (
        <p className="text-sm text-text-secondary">
          {emptyOrganizationsMessage(statusFilter, searchQuery)}
        </p>
      ) : undefined}

      <ul className="flex flex-col gap-4">
        {visibleOrganizations.map((organization) => {
          const selectedPersonIds = organisationAdminIds(
            people,
            organization.id,
          );
          const pickerPeople = peopleAvailableForOrganisationAdmin(
            people,
            selectedPersonIds,
          );

          return (
            <li key={organization.id}>
              <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
                <OrganizationCardHeader
                  title={organization.name}
                  headingLevel="h4"
                  slug={organization.slug}
                  status={organization.status}
                  adminFullNames={organisationAdminNames(
                    people,
                    organization.id,
                  )}
                />
                <FormField className="mt-4">
                  <Label htmlFor={`${organization.id}-organisation-admins`}>
                    Change organisation admins
                  </Label>
                  <SearchableMultiSelect
                    id={`${organization.id}-organisation-admins`}
                    placeholder="Search people not in an organisation"
                    options={personSelectOptions(pickerPeople)}
                    selectedIds={selectedPersonIds}
                    onSelectedIdsChange={(nextSelectedPersonIds) =>
                      void persistOrganisationAdminChanges(
                        organization.id,
                        selectedPersonIds,
                        nextSelectedPersonIds,
                      )
                    }
                  />
                </FormField>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
