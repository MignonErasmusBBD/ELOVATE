"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/platform";
import { PAGE_SHELL_CLASS } from "@/helpers/pageLayout";
import {
  PLATFORM_ADMIN_PAGE_ROLES,
  userHasAnyRole,
} from "@/helpers/currentUserProfile";
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
  const router = useRouter();
  const { profile, isLoading: isProfileLoading } = useCurrentUser();
  const [selectedSectionId, setSelectedSectionId] =
    useState<PlatformAdminSectionId>("companies");
  const canAccessPlatformAdminPage =
    profile === undefined
      ? false
      : userHasAnyRole(profile.roles, [...PLATFORM_ADMIN_PAGE_ROLES]);
  const directory = usePlatformAdminDirectory(canAccessPlatformAdminPage);

  useEffect(() => {
    if (isProfileLoading) {
      return;
    }
    if (profile === undefined) {
      return;
    }
    if (canAccessPlatformAdminPage === false) {
      router.replace("/courses");
    }
  }, [canAccessPlatformAdminPage, isProfileLoading, profile, router]);

  if (isProfileLoading || profile === undefined) {
    return (
      <section className={PAGE_SHELL_CLASS}>
        <p className="text-sm text-text-secondary">Loading account…</p>
      </section>
    );
  }

  if (canAccessPlatformAdminPage === false) {
    return undefined;
  }

  return (
    <section className={PAGE_SHELL_CLASS}>
      <AdminPageHeader
        title="Platform Admin"
        description="Create organisations, assign Platform Admin and Community Admin, and assign Org Admin per organisation."
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
          currentUserId={profile.id}
          onPeopleChange={directory.updatePeople}
          onOrganizationsChange={directory.updateOrganizations}
        />
      ) : undefined}
      {selectedSectionId === "roles" ? (
        <RolesSection
          organizations={directory.organizations}
          people={directory.people}
          roles={directory.roles}
          currentUserId={profile.id}
          isLoading={directory.isLoading}
          onDirectoryChanged={directory.reload}
          onPeopleChange={directory.updatePeople}
        />
      ) : undefined}
    </section>
  );
}
