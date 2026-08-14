"use client";

import { useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { Label } from "@/components/ui/Label";
import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";
import {
  adminCompanies,
  adminPeople,
  adminRoles,
} from "../data/placeholder";
import type { AdminPerson } from "../types";

function personSelectOptions(people: AdminPerson[]) {
  return people.map((person) => ({
    id: person.id,
    label: person.fullName,
    description: person.emailAddress,
  }));
}

const allPersonOptions = personSelectOptions(adminPeople);

const platformAdminRole = adminRoles.find(
  (role) => role.name === "platform_admin",
);

const communityAdminRole = adminRoles.find(
  (role) => role.name === "community_admin",
);

const organisationAdminRole = adminRoles.find(
  (role) => role.name === "org_admin",
);

function initialPlatformAdminPersonIds(): string[] {
  return adminPeople
    .filter((person) => person.roleNames.includes("Platform Admin"))
    .map((person) => person.id);
}

function initialCommunityAdminPersonIds(): string[] {
  return adminPeople
    .filter((person) => person.roleNames.includes("Community Admin"))
    .map((person) => person.id);
}

function initialOrganisationAdminIdsByOrganisationId(): Record<string, string[]> {
  const assignmentsByOrganisationId: Record<string, string[]> = {};

  for (const company of adminCompanies) {
    assignmentsByOrganisationId[company.id] = adminPeople
      .filter(
        (person) =>
          person.organizationId === company.id &&
          person.roleNames.includes("Org Admin"),
      )
      .map((person) => person.id);
  }

  return assignmentsByOrganisationId;
}

export function RolesSection() {
  const [platformAdminPersonIds, setPlatformAdminPersonIds] = useState(
    initialPlatformAdminPersonIds,
  );
  const [communityAdminPersonIds, setCommunityAdminPersonIds] = useState(
    initialCommunityAdminPersonIds,
  );
  const [organisationAdminIdsByOrganisationId, setOrganisationAdminIdsByOrganisationId] =
    useState(initialOrganisationAdminIdsByOrganisationId);

  function handleOrganisationAdminIdsChange(
    organisationId: string,
    selectedPersonIds: string[],
  ) {
    setOrganisationAdminIdsByOrganisationId((currentAssignments) => ({
      ...currentAssignments,
      [organisationId]: selectedPersonIds,
    }));
  }

  return (
    <section aria-labelledby="roles-heading" className="mt-8">
      <header className="mb-5">
        <h2 id="roles-heading" className="text-xl font-bold text-ink">
          Roles
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Platform Admin and Community Admin cover the whole platform.
          Organisational Admin is assigned per organisation.
        </p>
      </header>

      {platformAdminRole !== undefined ? (
        <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
          <header>
            <h3 className="text-base font-bold text-ink">
              {platformAdminRole.displayName}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              {platformAdminRole.description}
            </p>
          </header>
          <FormField className="mt-5">
            <Label htmlFor="platform-admin-people">
              People with this role
            </Label>
            <SearchableMultiSelect
              id="platform-admin-people"
              placeholder="Search anyone on the platform"
              options={allPersonOptions}
              selectedIds={platformAdminPersonIds}
              onSelectedIdsChange={setPlatformAdminPersonIds}
            />
          </FormField>
        </article>
      ) : undefined}

      {communityAdminRole !== undefined ? (
        <article className="mt-4 rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
          <header>
            <h3 className="text-base font-bold text-ink">
              {communityAdminRole.displayName}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              {communityAdminRole.description}
            </p>
          </header>
          <FormField className="mt-5">
            <Label htmlFor="community-admin-people">
              People with this role
            </Label>
            <SearchableMultiSelect
              id="community-admin-people"
              placeholder="Search anyone on the platform"
              options={allPersonOptions}
              selectedIds={communityAdminPersonIds}
              onSelectedIdsChange={setCommunityAdminPersonIds}
            />
          </FormField>
        </article>
      ) : undefined}

      {organisationAdminRole !== undefined ? (
        <section aria-labelledby="organisation-admin-heading" className="mt-10">
          <header className="mb-5">
            <h3
              id="organisation-admin-heading"
              className="text-lg font-bold text-ink"
            >
              Organisational Admin
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              {organisationAdminRole.description}
            </p>
          </header>

          <ul className="flex flex-col gap-4">
            {adminCompanies.map((company) => {
              const organisationPeople = adminPeople.filter(
                (person) => person.organizationId === company.id,
              );
              const selectedPersonIds =
                organisationAdminIdsByOrganisationId[company.id];

              return (
                <li key={company.id}>
                  <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
                    <h4 className="text-base font-bold text-ink">
                      {company.name}
                    </h4>
                    <FormField className="mt-4">
                      <Label htmlFor={`${company.id}-organisation-admins`}>
                        Organisation admins
                      </Label>
                      <SearchableMultiSelect
                        id={`${company.id}-organisation-admins`}
                        placeholder={`Search people in ${company.name}`}
                        options={personSelectOptions(organisationPeople)}
                        selectedIds={
                          selectedPersonIds === undefined
                            ? []
                            : selectedPersonIds
                        }
                        onSelectedIdsChange={(nextSelectedPersonIds) =>
                          handleOrganisationAdminIdsChange(
                            company.id,
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
      ) : undefined}
    </section>
  );
}
