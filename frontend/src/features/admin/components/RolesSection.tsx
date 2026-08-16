"use client";

import { useRef, useState } from "react";
import { ActionNotice } from "@/components/ui/ActionNotice";
import { FormField } from "@/components/ui/FormField";
import { Label } from "@/components/ui/Label";
import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";
import { Spinner } from "@/components/ui/Spinner";
import { useActionFeedback } from "@/features/platform";
import { notifyAccountChanged } from "@/helpers/accountEvents";
import { displayRoleName } from "@/helpers/displayLabels";
import { errorMessageFromUnknown } from "@/helpers/elovateApi";
import {
  peopleWithRole,
  personSelectOptions,
  withAssignedRole,
  withoutAssignedRole,
} from "../parseDirectory";
import { addedIds, assignRole, removedIds, unassignRole } from "../platformAdminApi";
import type { AdminPerson, DirectoryOrganization, DirectoryRole } from "../types";
import { OrganisationAdminAssignments } from "./OrganisationAdminAssignments";

type RolesSectionProps = Readonly<{
  organizations: DirectoryOrganization[];
  people: AdminPerson[];
  roles: DirectoryRole[];
  currentUserId: string | undefined;
  isLoading: boolean;
  onDirectoryChanged: () => Promise<void>;
  onPeopleChange: (nextPeople: AdminPerson[]) => void;
}>;

function findRole(
  roles: DirectoryRole[],
  roleName: string,
): DirectoryRole | undefined {
  return roles.find((role) => role.roleName === roleName);
}

export function RolesSection({
  organizations,
  people,
  roles,
  currentUserId,
  isLoading,
  onDirectoryChanged,
  onPeopleChange,
}: RolesSectionProps) {
  const { showSuccess } = useActionFeedback();
  const [actionError, setActionError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const saveLock = useRef(false);

  const platformAdminRole = findRole(roles, "platform_admin");
  const communityAdminRole = findRole(roles, "community_admin");
  const organisationAdminRole = findRole(roles, "org_admin");

  async function persistRoleChanges(
    roleName: string,
    previousIds: string[],
    nextIds: string[],
  ) {
    const addedUserIds = addedIds(previousIds, nextIds);
    const removedUserIds = removedIds(previousIds, nextIds);

    if (
      roleName === "platform_admin" &&
      currentUserId !== undefined &&
      removedUserIds.includes(currentUserId)
    ) {
      setActionError("You cannot remove your own Platform Admin role.");
      return;
    }

    if (saveLock.current) {
      return;
    }
    saveLock.current = true;
    setIsSaving(true);
    setActionError(undefined);
    onPeopleChange(
      withoutAssignedRole(
        withAssignedRole(people, addedUserIds, roleName),
        removedUserIds,
        roleName,
      ),
    );
    try {
      await Promise.all([
        ...addedUserIds.map((userId) => assignRole(userId, roleName)),
        ...removedUserIds.map((userId) => unassignRole(userId, roleName)),
      ]);
      if (
        currentUserId !== undefined &&
        (addedUserIds.includes(currentUserId) ||
          removedUserIds.includes(currentUserId))
      ) {
        notifyAccountChanged();
      }
      showSuccess(`${displayRoleName(roleName)} assignments updated.`);
    } catch (error) {
      setActionError(
        errorMessageFromUnknown(error, "Could not update role assignments."),
      );
      await onDirectoryChanged();
    } finally {
      saveLock.current = false;
      setIsSaving(false);
    }
  }

  return (
    <section aria-labelledby="roles-heading" className="mt-8">
      <header className="mb-5">
        <h2 id="roles-heading" className="text-xl font-bold text-ink">
          Roles
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Platform Admin and Community Admin cover the whole platform.
          Org Admin is assigned per organisation. Only people who are not
          already in an organisation can be added. Adding someone places them
          in that organisation and grants Org Admin.
        </p>
      </header>

      {isLoading && organizations.length === 0 ? (
        <p className="text-sm text-text-secondary">Loading roles…</p>
      ) : undefined}

      {actionError === undefined ? undefined : (
        <ActionNotice tone="error" message={actionError} className="mb-4" />
      )}

      {platformAdminRole !== undefined ? (
        <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
          <header>
            <h3 className="text-base font-bold text-ink">
              {displayRoleName(platformAdminRole.roleName)}
            </h3>
            {platformAdminRole.description === undefined ? undefined : (
              <p className="mt-1 text-sm text-text-secondary">
                {platformAdminRole.description}
              </p>
            )}
          </header>
          <FormField className="mt-5">
            <Label htmlFor="platform-admin-people">
              People with this role
            </Label>
            <SearchableMultiSelect
              id="platform-admin-people"
              placeholder="Search anyone on the platform"
              options={personSelectOptions(people)}
              selectedIds={peopleWithRole(people, "platform_admin")}
              onSelectedIdsChange={(nextSelectedIds) => {
                void persistRoleChanges(
                  "platform_admin",
                  peopleWithRole(people, "platform_admin"),
                  nextSelectedIds,
                );
              }}
            />
          </FormField>
        </article>
      ) : undefined}

      {communityAdminRole !== undefined ? (
        <article className="mt-4 rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
          <header>
            <h3 className="text-base font-bold text-ink">
              {displayRoleName(communityAdminRole.roleName)}
            </h3>
            {communityAdminRole.description === undefined ? undefined : (
              <p className="mt-1 text-sm text-text-secondary">
                {communityAdminRole.description}
              </p>
            )}
          </header>
          <FormField className="mt-5">
            <Label htmlFor="community-admin-people">
              People with this role
            </Label>
            <SearchableMultiSelect
              id="community-admin-people"
              placeholder="Search anyone on the platform"
              options={personSelectOptions(people)}
              selectedIds={peopleWithRole(people, "community_admin")}
              onSelectedIdsChange={(nextSelectedIds) => {
                void persistRoleChanges(
                  "community_admin",
                  peopleWithRole(people, "community_admin"),
                  nextSelectedIds,
                );
              }}
            />
          </FormField>
        </article>
      ) : undefined}

      {organisationAdminRole === undefined ? undefined : (
        <OrganisationAdminAssignments
          role={organisationAdminRole}
          organizations={organizations}
          people={people}
          currentUserId={currentUserId}
          onDirectoryChanged={onDirectoryChanged}
          onPeopleChange={onPeopleChange}
          onSavingChange={setIsSaving}
          onError={setActionError}
        />
      )}

      {isSaving ? (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-text-secondary">
          <Spinner className="size-4" />
          Saving changes…
        </p>
      ) : undefined}
    </section>
  );
}
