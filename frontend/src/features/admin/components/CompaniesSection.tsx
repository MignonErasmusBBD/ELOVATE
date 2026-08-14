"use client";

import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";
import {
  clearFieldError,
  hasFieldErrors,
} from "@/helpers/formErrors";
import {
  validateAtLeastOneSelected,
  validateRequiredName,
} from "@/helpers/validation";
import { adminCompanies, adminPeople } from "../data/placeholder";
import { StatusPill } from "./StatusPill";

type CompanyFieldErrors = {
  companyName?: string;
  companyAdmins?: string;
};

const personOptions = adminPeople.map((person) => ({
  id: person.id,
  label: person.fullName,
  description: person.emailAddress,
}));

export function CompaniesSection() {
  const [companyName, setCompanyName] = useState("");
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<CompanyFieldErrors>({});

  function handleCreateSubmit(submitEvent: SubmitEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    const nextFieldErrors: CompanyFieldErrors = {
      companyName: validateRequiredName(companyName, "Organisation name"),
      companyAdmins: validateAtLeastOneSelected(selectedAdminIds, "admin"),
    };
    setFieldErrors(nextFieldErrors);

    if (hasFieldErrors(nextFieldErrors)) {
      return;
    }
  }

  return (
    <section aria-labelledby="companies-heading" className="mt-8">
      <header className="mb-5">
        <h2 id="companies-heading" className="text-xl font-bold text-ink">
          Organisations
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Create organisations and assign at least one admin.
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
            placeholder="Search people to assign as admin"
            options={personOptions}
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

        <Button variant="compact" type="submit" className="self-start">
          Create
        </Button>
      </form>

      <ul className="flex flex-col gap-4">
        {adminCompanies.map((company) => (
          <li key={company.id}>
            <article className="flex flex-col gap-3 rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)] sm:flex-row sm:items-center sm:justify-between">
              <header>
                <h3 className="text-base font-bold text-ink">{company.name}</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {company.adminFullNames.map((adminFullName) => (
                    <li key={adminFullName}>
                      <StatusPill label={adminFullName} />
                    </li>
                  ))}
                </ul>
                <p className="mt-2">
                  <StatusPill
                    label={
                      company.status === "active" ? "Active" : "Suspended"
                    }
                    tone={company.status === "active" ? "accent" : "muted"}
                  />
                </p>
              </header>
              {company.status === "active" ? (
                <button
                  type="button"
                  className="self-start text-sm font-semibold text-coral sm:self-center"
                >
                  Suspend
                </button>
              ) : undefined}
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
