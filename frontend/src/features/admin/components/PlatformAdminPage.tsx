"use client";

import { useState } from "react";
import type { PlatformAdminSectionId } from "../types";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminSectionNav } from "./AdminSectionNav";
import { CompaniesSection } from "./CompaniesSection";
import { RolesSection } from "./RolesSection";

const platformAdminSections: {
  id: PlatformAdminSectionId;
  label: string;
}[] = [
  { id: "companies", label: "Organisations" },
  { id: "roles", label: "Roles" },
];

export function PlatformAdminPage() {
  const [selectedSectionId, setSelectedSectionId] =
    useState<PlatformAdminSectionId>("companies");

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
      <AdminPageHeader
        title="Platform Admin"
        description="Create organisations, assign Platform Admin and Community Admin, and assign Organisational Admin per organisation."
      />
      <AdminSectionNav
        items={platformAdminSections}
        selectedSectionId={selectedSectionId}
        onSelectSection={setSelectedSectionId}
      />
      {selectedSectionId === "companies" ? <CompaniesSection /> : undefined}
      {selectedSectionId === "roles" ? <RolesSection /> : undefined}
    </section>
  );
}
