"use client";

import { useState, type SubmitEvent } from "react";
import { ActionNotice } from "@/components/ui/ActionNotice";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { useActionFeedback } from "@/features/platform";
import { errorMessageFromUnknown } from "@/helpers/elovateApi";
import { selectedIfAvailable } from "@/helpers/selectedIfAvailable";
import { selectPlaceholder } from "@/helpers/selectPlaceholder";
import {
  displayRoleName,
  withAssignedRole,
  withoutAssignedRole,
} from "../parseDirectory";
import { assignRole, unassignRole } from "../platformAdminApi";
import { placePersonInOrganisation, setPersonStatus } from "../orgAdminApi";
import {
  emptyStatusFilterMessage,
  itemsMatchingStatusAndSearch,
  type StatusFilter,
  type StatusFilterOption,
} from "../statusFilter";
import type { AdminPerson, PersonStatus } from "../types";
import { StatusFilterNav } from "./StatusFilterNav";
import { StatusPill } from "./StatusPill";

const personStatusFilters: StatusFilterOption<StatusFilter<PersonStatus>>[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "deactivated", label: "Deactivated" },
];

const assignableRoleNames = ["org_admin", "educator"] as const;

type PeopleSectionProps = Readonly<{
  organizationName: string | undefined;
  organizationId: string | undefined;
  people: AdminPerson[];
  unassignedPeople: AdminPerson[];
  isLoading: boolean;
  isLoadingUnassigned: boolean;
  currentUserId: string | undefined;
  onPeopleChange: (nextPeople: AdminPerson[]) => void;
  onUnassignedPeopleChange: (nextPeople: AdminPerson[]) => void;
  onDirectoryChanged: () => Promise<void>;
}>;

export function PeopleSection({
  organizationName,
  organizationId,
  people,
  unassignedPeople,
  isLoading,
  isLoadingUnassigned,
  currentUserId,
  onPeopleChange,
  onUnassignedPeopleChange,
  onDirectoryChanged,
}: PeopleSectionProps) {
  const { showSuccess } = useActionFeedback();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter<PersonStatus>>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [formError, setFormError] = useState<string | undefined>();
  const [actionError, setActionError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const organisationName = organizationName ?? "your organisation";
  const organisationMembers = people.filter((person) => {
    if (person.id === currentUserId) {
      return false;
    }
    if (organizationId === undefined) {
      return false;
    }
    return person.organizationId === organizationId;
  });

  const visiblePeople = itemsMatchingStatusAndSearch(
    [...organisationMembers].sort((left, right) =>
      left.fullName.localeCompare(right.fullName),
    ),
    statusFilter,
    searchQuery,
    (person) => person.status,
    (person) => [person.fullName, person.emailAddress],
  );

  const addablePeople = unassignedPeople.filter(
    (person) => person.status === "active",
  );
  const addUserId = selectedIfAvailable(
    selectedUserId,
    addablePeople.map((person) => person.id),
  );

  async function handleAddPersonSubmit(
    submitEvent: SubmitEvent<HTMLFormElement>,
  ) {
    submitEvent.preventDefault();
    if (addUserId === "") {
      setFormError("Choose a person who is not in an organisation.");
      return;
    }
    if (organizationId === undefined) {
      setFormError("You need an organisation to add people.");
      return;
    }

    setFormError(undefined);
    setActionError(undefined);
    setIsSaving(true);
    try {
      const placedPerson = await placePersonInOrganisation(addUserId);
      if (placedPerson === undefined) {
        setFormError("Could not add that person.");
        return;
      }
      onUnassignedPeopleChange(
        unassignedPeople.filter((person) => person.id !== placedPerson.id),
      );
      onPeopleChange([
        ...people.filter((person) => person.id !== placedPerson.id),
        {
          ...placedPerson,
          organizationId,
        },
      ]);
      showSuccess(`${placedPerson.fullName} was added to the organisation.`);
    } catch (error) {
      setFormError(
        errorMessageFromUnknown(error, "Could not add that person."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function persistRoleAssignment(
    person: AdminPerson,
    roleName: string,
    isAssigned: boolean,
  ) {
    if (
      roleName === "org_admin" &&
      isAssigned === false &&
      person.id === currentUserId
    ) {
      setActionError("You cannot remove your own Org Admin role.");
      return;
    }

    setActionError(undefined);
    onPeopleChange(
      isAssigned
        ? withAssignedRole(people, [person.id], roleName)
        : withoutAssignedRole(people, [person.id], roleName),
    );
    try {
      if (isAssigned) {
        await assignRole(person.id, roleName);
        showSuccess(
          `${displayRoleName(roleName)} assigned to ${person.fullName}.`,
        );
      } else {
        await unassignRole(person.id, roleName);
        showSuccess(
          `${displayRoleName(roleName)} removed from ${person.fullName}.`,
        );
      }
    } catch (error) {
      setActionError(
        errorMessageFromUnknown(error, "Could not update the role."),
      );
      await onDirectoryChanged();
    }
  }

  async function persistPersonStatus(
    person: AdminPerson,
    status: PersonStatus,
  ) {
    if (person.id === currentUserId) {
      setActionError("You cannot deactivate yourself.");
      return;
    }

    setActionError(undefined);
    onPeopleChange(
      people.map((candidate) => {
        if (candidate.id !== person.id) {
          return candidate;
        }
        return {
          ...candidate,
          status,
        };
      }),
    );
    try {
      await setPersonStatus(person.id, status);
      showSuccess(
        status === "active"
          ? `${person.fullName} is active again.`
          : `${person.fullName} was deactivated.`,
      );
    } catch (error) {
      setActionError(
        errorMessageFromUnknown(error, "Could not update person status."),
      );
      await onDirectoryChanged();
    }
  }

  return (
    <section aria-labelledby="people-heading" className="mt-8">
      <header className="mb-5">
        <h2 id="people-heading" className="text-xl font-bold text-ink">
          People
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Add people who are not in an organisation yet. Everyone stays a
          Learner. Add or remove Organisational Admin and Educator for people
          in {organisationName}.
        </p>
      </header>

      <form
        className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
        onSubmit={handleAddPersonSubmit}
      >
        <FormField>
          <Label htmlFor="add-person">Person</Label>
          <Select
            id="add-person"
            name="addPerson"
            value={addUserId}
            onChange={(changeEvent) =>
              setSelectedUserId(changeEvent.target.value)
            }
          >
            <option value="">
              {selectPlaceholder(
                isLoadingUnassigned,
                addablePeople.length > 0,
                "Loading people…",
                "No people without an organisation",
                "Select a person",
              )}
            </option>
            {addablePeople.map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName}
              </option>
            ))}
          </Select>
        </FormField>
        <Button variant="compact" type="submit" isBusy={isSaving}>
          {isSaving ? "Adding…" : "Add"}
        </Button>
      </form>

      {formError === undefined ? undefined : (
        <FieldError id="add-person-error" message={formError} />
      )}

      {actionError === undefined ? undefined : (
        <ActionNotice tone="error" message={actionError} className="mb-4" />
      )}

      {organisationMembers.length > 0 ? (
        <StatusFilterNav
          ariaLabel="Person status"
          filters={personStatusFilters}
          selectedFilter={statusFilter}
          onSelectFilter={setStatusFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          searchInputId="people-search"
          searchLabel="Search people"
          searchPlaceholder="Search people"
        />
      ) : undefined}

      {isLoading && organisationMembers.length === 0 ? (
        <p className="text-sm text-text-secondary">Loading people…</p>
      ) : undefined}

      {isLoading === false && organisationMembers.length === 0 ? (
        <p className="text-sm text-text-secondary">
          No other people in {organisationName} yet.
        </p>
      ) : undefined}

      {organisationMembers.length > 0 && visiblePeople.length === 0 ? (
        <p className="text-sm text-text-secondary">
          {emptyStatusFilterMessage(statusFilter, searchQuery, "people")}
        </p>
      ) : undefined}

      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_10rem_10rem_8.5rem]">
        {visiblePeople.map((person) => {
          const isActive = person.status === "active";

          return (
            <li
              key={person.id}
              className="col-span-full grid grid-cols-1 gap-4 rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)] lg:grid-cols-subgrid lg:items-center"
            >
              <header>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-ink">
                    {person.fullName}
                  </h3>
                  <StatusPill
                    label={isActive ? "Active" : "Deactivated"}
                    tone={isActive ? "success" : "danger"}
                  />
                </div>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {person.emailAddress}
                </p>
                {person.roleNames.length === 0 ? undefined : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {person.roleNames.map((roleName) => (
                      <li key={roleName}>
                        <StatusPill label={displayRoleName(roleName)} />
                      </li>
                    ))}
                  </ul>
                )}
              </header>

              {assignableRoleNames.map((roleName) => (
                <label
                  key={roleName}
                  className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-2 text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 justify-self-center accent-coral"
                    checked={person.roleNames.includes(roleName)}
                    onChange={(changeEvent) =>
                      void persistRoleAssignment(
                        person,
                        roleName,
                        changeEvent.target.checked,
                      )
                    }
                  />
                  <span>{displayRoleName(roleName)}</span>
                </label>
              ))}

              {isActive ? (
                <Button
                  variant="outline"
                  type="button"
                  className="justify-self-start lg:w-full"
                  onClick={() =>
                    void persistPersonStatus(person, "deactivated")
                  }
                >
                  Deactivate
                </Button>
              ) : (
                <Button
                  variant="compact"
                  type="button"
                  className="justify-self-start lg:w-full"
                  onClick={() => void persistPersonStatus(person, "active")}
                >
                  Activate
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
