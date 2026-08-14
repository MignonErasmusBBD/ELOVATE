"use client";

import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { adminPeople, currentOrganisation } from "../data/placeholder";
import { StatusPill } from "./StatusPill";

type OrganisationRoleAssignment = {
  isOrganisationAdmin: boolean;
  isEducator: boolean;
};

const organisationPeople = adminPeople.filter(
  (person) => person.organizationId === currentOrganisation.id,
);

const readOnlyRoleNames = [
  "Learner",
  "Platform Admin",
  "Community Admin",
];

function buildInitialRoleAssignments(): Record<
  string,
  OrganisationRoleAssignment
> {
  const assignmentsByPersonId: Record<string, OrganisationRoleAssignment> = {};

  for (const person of organisationPeople) {
    assignmentsByPersonId[person.id] = {
      isOrganisationAdmin: person.roleNames.includes("Org Admin"),
      isEducator: person.roleNames.includes("Educator"),
    };
  }

  return assignmentsByPersonId;
}

function readOnlyRolesForPerson(roleNames: string[]): string[] {
  return roleNames.filter((roleName) => readOnlyRoleNames.includes(roleName));
}

export function PeopleSection() {
  const [inviteEmailAddress, setInviteEmailAddress] = useState("");
  const [roleAssignmentsByPersonId, setRoleAssignmentsByPersonId] = useState(
    buildInitialRoleAssignments,
  );

  function handleInviteSubmit(submitEvent: SubmitEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
  }

  function updateRoleAssignment(
    personId: string,
    assignmentKey: keyof OrganisationRoleAssignment,
    isAssigned: boolean,
  ) {
    setRoleAssignmentsByPersonId((currentAssignments) => {
      const currentAssignment = currentAssignments[personId];

      if (currentAssignment === undefined) {
        return currentAssignments;
      }

      return {
        ...currentAssignments,
        [personId]: {
          ...currentAssignment,
          [assignmentKey]: isAssigned,
        },
      };
    });
  }

  return (
    <section aria-labelledby="people-heading" className="mt-8">
      <header className="mb-5">
        <h2 id="people-heading" className="text-xl font-bold text-ink">
          People
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Everyone stays a Learner. Add or remove Organisational Admin and
          Educator for people in {currentOrganisation.name}. Private courses
          stay with the organisation if an educator is removed.
        </p>
      </header>

      <form
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={handleInviteSubmit}
      >
        <FormField className="sm:flex-1">
          <Label htmlFor="invite-email">Email address</Label>
          <Input
            id="invite-email"
            name="inviteEmail"
            type="email"
            autoComplete="email"
            placeholder="name@organisation.com"
            value={inviteEmailAddress}
            onChange={(changeEvent) =>
              setInviteEmailAddress(changeEvent.target.value)
            }
          />
        </FormField>
        <Button variant="compact" type="submit">
          Invite
        </Button>
      </form>

      <ul className="flex flex-col gap-4">
        {organisationPeople.map((person) => {
          const roleAssignment = roleAssignmentsByPersonId[person.id];
          const isOrganisationAdmin =
            roleAssignment === undefined
              ? false
              : roleAssignment.isOrganisationAdmin;
          const isEducator =
            roleAssignment === undefined ? false : roleAssignment.isEducator;

          return (
            <li key={person.id}>
              <article className="flex flex-col gap-4 rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)] lg:flex-row lg:items-start lg:justify-between">
                <header>
                  <h3 className="text-base font-bold text-ink">
                    {person.fullName}
                  </h3>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    {person.emailAddress}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {readOnlyRolesForPerson(person.roleNames).map(
                      (roleName) => (
                        <li key={roleName}>
                          <StatusPill label={roleName} />
                        </li>
                      ),
                    )}
                  </ul>
                </header>

                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                  <legend className="text-xs font-medium text-text-secondary">
                    Organisation roles
                  </legend>
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-coral"
                      checked={isOrganisationAdmin}
                      onChange={(changeEvent) =>
                        updateRoleAssignment(
                          person.id,
                          "isOrganisationAdmin",
                          changeEvent.target.checked,
                        )
                      }
                    />
                    Organisational Admin
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-coral"
                      checked={isEducator}
                      onChange={(changeEvent) =>
                        updateRoleAssignment(
                          person.id,
                          "isEducator",
                          changeEvent.target.checked,
                        )
                      }
                    />
                    Educator
                  </label>
                </fieldset>

                <button
                  type="button"
                  className="self-start text-sm font-semibold text-coral"
                >
                  Deactivate
                </button>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
