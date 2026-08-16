"use client";

import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";
import { useActionFeedback } from "@/features/platform";
import { notifyAccountChanged } from "@/helpers/accountEvents";
import { errorMessageFromUnknown } from "@/helpers/elovateApi";
import { clearFieldError, hasFieldErrors } from "@/helpers/formErrors";
import {
  validateAtLeastOneSelected,
  validateRequiredName,
} from "@/helpers/validation";
import {
  organisationAdminNames,
  peopleAvailableForOrganisationAdmin,
  personSelectOptions,
  previewSlugFromName,
  withOrganisationAdmin,
} from "../parseDirectory";
import {
  createOrganisation,
  setOrganisationStatus,
} from "../platformAdminApi";
import type { OrganizationStatusFilter } from "../organizationStatusFilter";
import {
  emptyOrganizationsMessage,
  visibleOrganizationsForFilter,
} from "../organizationStatusFilter";
import type { AdminPerson, DirectoryOrganization } from "../types";
import { OrganizationCardHeader } from "./OrganizationCardHeader";
import { OrganizationStatusFilterNav } from "./OrganizationStatusFilterNav";

type CompanyFieldErrors = {
  companyName?: string;
  companyAdmins?: string;
  form?: string;
};

type CompaniesSectionProps = Readonly<{
  organizations: DirectoryOrganization[];
  people: AdminPerson[];
  isLoading: boolean;
  currentUserId: string | undefined;
  onPeopleChange: (nextPeople: AdminPerson[]) => void;
  onOrganizationsChange: (nextOrganizations: DirectoryOrganization[]) => void;
}>;

export function CompaniesSection({
  organizations,
  people,
  isLoading,
  currentUserId,
  onPeopleChange,
  onOrganizationsChange,
}: CompaniesSectionProps) {
  const { showSuccess } = useActionFeedback();
  const [companyName, setCompanyName] = useState("");
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<CompanyFieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [statusErrorByOrganizationId, setStatusErrorByOrganizationId] =
    useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] =
    useState<OrganizationStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const visibleOrganizations = visibleOrganizationsForFilter(
    organizations,
    statusFilter,
    searchQuery,
  );

  async function handleCreateSubmit(submitEvent: SubmitEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    const nextFieldErrors: CompanyFieldErrors = {
      companyName: validateRequiredName(companyName, "Organisation name"),
      companyAdmins: validateAtLeastOneSelected(selectedAdminIds, "admin"),
    };
    setFieldErrors(nextFieldErrors);

    if (hasFieldErrors(nextFieldErrors)) {
      return;
    }

    const trimmedName = companyName.trim();
    const pendingOrganizationId = crypto.randomUUID();
    const pendingOrganization: DirectoryOrganization = {
      id: pendingOrganizationId,
      name: trimmedName,
      slug: previewSlugFromName(trimmedName),
      status: "active",
    };
    const previousPeople = people;
    const previousOrganizations = organizations;

    setCompanyName("");
    setSelectedAdminIds([]);
    setFieldErrors({});
    onOrganizationsChange([pendingOrganization, ...organizations]);
    onPeopleChange(
      withOrganisationAdmin(people, pendingOrganizationId, selectedAdminIds),
    );

    setIsSaving(true);
    try {
      const createdOrganization = await createOrganisation({
        name: trimmedName,
        adminUserIds: selectedAdminIds,
      });
      if (createdOrganization === undefined) {
        onOrganizationsChange(previousOrganizations);
        onPeopleChange(previousPeople);
        setFieldErrors({
          form: "Could not create the organisation.",
        });
        return;
      }
      onOrganizationsChange([
        createdOrganization,
        ...previousOrganizations,
      ]);
      onPeopleChange(
        withOrganisationAdmin(
          previousPeople,
          createdOrganization.id,
          selectedAdminIds,
        ),
      );
      if (
        currentUserId !== undefined &&
        selectedAdminIds.includes(currentUserId)
      ) {
        notifyAccountChanged();
      }
      showSuccess(`${createdOrganization.name} was created.`);
    } catch (error) {
      onOrganizationsChange(previousOrganizations);
      onPeopleChange(previousPeople);
      setFieldErrors({
        form: errorMessageFromUnknown(
          error,
          "Could not create the organisation.",
        ),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(
    organizationId: string,
    status: "active" | "suspended",
  ) {
    setStatusErrorByOrganizationId((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[organizationId];
      return nextErrors;
    });
    const previousOrganizations = organizations;
    onOrganizationsChange(
      organizations.map((organization) => {
        if (organization.id !== organizationId) {
          return organization;
        }
        return {
          ...organization,
          status,
        };
      }),
    );
    try {
      await setOrganisationStatus(organizationId, status);
      showSuccess(
        status === "active"
          ? "Organisation is active again."
          : "Organisation was suspended.",
      );
    } catch (error) {
      onOrganizationsChange(previousOrganizations);
      setStatusErrorByOrganizationId((currentErrors) => ({
        ...currentErrors,
        [organizationId]: errorMessageFromUnknown(
          error,
          "Could not update organisation status.",
        ),
      }));
    }
  }

  return (
    <section aria-labelledby="companies-heading" className="mt-8">
      <header className="mb-5">
        <h2 id="companies-heading" className="text-xl font-bold text-ink">
          Organisations
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Create organisations and assign at least one admin. Only people who
          are not already in an organisation can be assigned. They are placed
          in the new organisation and granted Org Admin.
        </p>
      </header>

      <form
        className="mb-6 flex flex-col gap-4 rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]"
        onSubmit={handleCreateSubmit}
        noValidate
      >
        <FormField>
          <Label htmlFor="company-name">Organisation name</Label>
          <Input
            id="company-name"
            name="companyName"
            type="text"
            placeholder="Organisation name"
            value={companyName}
            invalid={fieldErrors.companyName !== undefined}
            onChange={(changeEvent) => {
              setCompanyName(changeEvent.target.value);
              setFieldErrors((currentFieldErrors) =>
                clearFieldError(currentFieldErrors, "companyName"),
              );
            }}
            aria-describedby={
              fieldErrors.companyName !== undefined
                ? "company-name-error"
                : undefined
            }
          />
          {fieldErrors.companyName !== undefined ? (
            <FieldError
              id="company-name-error"
              message={fieldErrors.companyName}
            />
          ) : undefined}
        </FormField>

        <FormField>
          <Label htmlFor="company-admins">Organisation admins</Label>
          <SearchableMultiSelect
            id="company-admins"
            placeholder="Search people not in an organisation"
            options={personSelectOptions(
              peopleAvailableForOrganisationAdmin(people, selectedAdminIds),
            )}
            selectedIds={selectedAdminIds}
            onSelectedIdsChange={(nextSelectedIds) => {
              setSelectedAdminIds(nextSelectedIds);
              setFieldErrors((currentFieldErrors) =>
                clearFieldError(currentFieldErrors, "companyAdmins"),
              );
            }}
            invalid={fieldErrors.companyAdmins !== undefined}
            describedBy={
              fieldErrors.companyAdmins !== undefined
                ? "company-admins-error"
                : undefined
            }
          />
          {fieldErrors.companyAdmins !== undefined ? (
            <FieldError
              id="company-admins-error"
              message={fieldErrors.companyAdmins}
            />
          ) : undefined}
        </FormField>

        {fieldErrors.form !== undefined ? (
          <FieldError id="company-form-error" message={fieldErrors.form} />
        ) : undefined}

        <Button
          variant="compact"
          type="submit"
          className="self-start"
          isBusy={isSaving}
        >
          {isSaving ? "Creating…" : "Create"}
        </Button>
      </form>

      {organizations.length > 0 ? (
        <OrganizationStatusFilterNav
          selectedFilter={statusFilter}
          onSelectFilter={setStatusFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          searchInputId="companies-organization-search"
        />
      ) : undefined}

      {isLoading && organizations.length === 0 ? (
        <p className="text-sm text-text-secondary">Loading organisations…</p>
      ) : undefined}

      {isLoading === false && organizations.length === 0 ? (
        <p className="text-sm text-text-secondary">
          No organisations yet. Create one above.
        </p>
      ) : undefined}

      {organizations.length > 0 && visibleOrganizations.length === 0 ? (
        <p className="text-sm text-text-secondary">
          {emptyOrganizationsMessage(statusFilter, searchQuery)}
        </p>
      ) : undefined}

      <ul className="flex flex-col gap-4">
        {visibleOrganizations.map((organization) => {
          const adminFullNames = organisationAdminNames(
            people,
            organization.id,
          );
          const statusError = statusErrorByOrganizationId[organization.id];

          return (
            <li key={organization.id}>
              <article className="flex flex-col gap-3 rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <OrganizationCardHeader
                    title={organization.name}
                    headingLevel="h3"
                    slug={organization.slug}
                    status={organization.status}
                    adminFullNames={adminFullNames}
                  />
                  {statusError === undefined ? undefined : (
                    <p className="mt-2 text-sm text-coral">{statusError}</p>
                  )}
                </div>
                {organization.status === "active" ? (
                  <Button
                    variant="outline"
                    type="button"
                    className="self-start sm:self-center"
                    onClick={() =>
                      void handleStatusChange(organization.id, "suspended")
                    }
                  >
                    Suspend
                  </Button>
                ) : (
                  <Button
                    variant="compact"
                    type="button"
                    className="self-start sm:self-center"
                    onClick={() =>
                      void handleStatusChange(organization.id, "active")
                    }
                  >
                    Activate
                  </Button>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
