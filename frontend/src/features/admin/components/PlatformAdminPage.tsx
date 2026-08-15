"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { PlatformAdminSectionId } from "../types";
import { usePlatformAdminDirectory } from "../usePlatformAdminDirectory";
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
  const session = authClient.useSession();
  const directory = usePlatformAdminDirectory();

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
      <AdminPageHeader
        title="Platform Admin"
        description="Create organisations, assign platform_admin and community_admin, and assign org_admin per organisation."
      />
      <AdminSectionNav
        items={platformAdminSections}
        selectedSectionId={selectedSectionId}
        onSelectSection={setSelectedSectionId}
      />
      {directory.errorMessage === undefined ? undefined : (
        <p className="mt-6 text-sm text-coral" role="alert">
          {directory.errorMessage}
        </p>
      )}
      {selectedSectionId === "companies" ? (
        <CompaniesSection
          organizations={directory.organizations}
          people={directory.people}
          isLoading={directory.isLoading}
          currentUserId={session.data?.user.id}
          onPeopleChange={directory.updatePeople}
          onOrganizationsChange={directory.updateOrganizations}
        />
      ) : undefined}
      {selectedSectionId === "roles" ? (
        <RolesSection
          organizations={directory.organizations}
          people={directory.people}
          roles={directory.roles}
          currentUserId={session.data?.user.id}
          isLoading={directory.isLoading}
          onDirectoryChanged={directory.reload}
          onPeopleChange={directory.updatePeople}
        />
      ) : undefined}
    </section>
  );
}
