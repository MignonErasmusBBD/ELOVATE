"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/platform";
import {
  ORG_ADMIN_PAGE_ROLES,
  userHasAnyRole,
} from "@/helpers/currentUserProfile";
import type { OrgAdminSectionId } from "../types";
import { useOrgAdminDirectory } from "../useOrgAdminDirectory";
import { createOrgPrivateCourse } from "../orgAdminApi";
import { AdminCoursesSection } from "./AdminCoursesSection";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminSectionNav } from "./AdminSectionNav";
import { EnrolmentsSection } from "./EnrolmentsSection";
import { PeopleSection } from "./PeopleSection";

const orgAdminSections: { id: OrgAdminSectionId; label: string }[] = [
  { id: "people", label: "People" },
  { id: "courses", label: "Courses" },
  { id: "enrolments", label: "Enrolments" },
];

export function OrgAdminPage() {
  const router = useRouter();
  const {
    profile,
    isLoading: isProfileLoading,
    errorMessage: profileErrorMessage,
  } = useCurrentUser();
  const [selectedSectionId, setSelectedSectionId] =
    useState<OrgAdminSectionId>("people");
  const canAccessOrgAdminPage =
    profile === undefined
      ? false
      : userHasAnyRole(profile.roles, [...ORG_ADMIN_PAGE_ROLES]);
  const directory = useOrgAdminDirectory(
    profile === undefined ? undefined : profile.organizationId,
    canAccessOrgAdminPage,
  );

  useEffect(() => {
    if (isProfileLoading) {
      return;
    }
    if (profile === undefined) {
      return;
    }
    if (canAccessOrgAdminPage === false) {
      router.replace("/courses");
    }
  }, [canAccessOrgAdminPage, isProfileLoading, profile, router]);

  if (isProfileLoading || profile === undefined) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
        <p className="text-sm text-text-secondary">
          {profileErrorMessage ?? "Loading account…"}
        </p>
      </section>
    );
  }

  if (canAccessOrgAdminPage === false) {
    return undefined;
  }

  if (profile.organizationId === undefined) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
        <AdminPageHeader
          title="Organisational Admin"
          description="Add people, manage private courses, and enrol members."
        />
        <p className="mt-8 text-sm text-text-secondary">
          Your account is not linked to an organisation, so there is nothing to
          administer here yet.
        </p>
      </section>
    );
  }

  const organizationId = profile.organizationId;
  const organisationName = profile.organizationName ?? "your organisation";

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
      <AdminPageHeader
        title="Organisational Admin"
        description="Add people, assign Organisational Admin and Educator, and manage private courses."
      />
      <AdminSectionNav
        items={orgAdminSections}
        selectedSectionId={selectedSectionId}
        onSelectSection={setSelectedSectionId}
      />
      {directory.errorMessage === undefined ? undefined : (
        <p className="mt-6 text-sm text-coral" role="alert">
          {directory.errorMessage}
        </p>
      )}
      {selectedSectionId === "people" ? (
        <PeopleSection
          organizationName={profile.organizationName}
          organizationId={organizationId}
          people={directory.people}
          unassignedPeople={directory.unassignedPeople}
          isLoading={directory.isLoadingPeople}
          isLoadingUnassigned={directory.isLoadingUnassignedPeople}
          currentUserId={profile.id}
          onPeopleChange={directory.updatePeople}
          onUnassignedPeopleChange={directory.updateUnassignedPeople}
          onDirectoryChanged={directory.reload}
        />
      ) : undefined}
      {selectedSectionId === "courses" ? (
        <AdminCoursesSection
          heading="Private courses"
          description={`These courses belong to ${organisationName}, not to a single educator. Removing the Educator role does not remove the course. Enrol people from Enrolments to grant access.`}
          emptyMessage={`No private courses in ${organisationName} yet. Add one above.`}
          titleFieldId="private-course-title"
          titlePlaceholder="Private course title"
          descriptionFieldId="private-course-description"
          searchInputId="courses-search"
          visibilityLabel="Organisation"
          canCreate={true}
          createBlockedMessage={undefined}
          courses={directory.courses}
          isLoading={directory.isLoadingCourses}
          onCreate={(title, description) =>
            createOrgPrivateCourse(organizationId, title, description)
          }
          onCoursesChange={directory.updateCourses}
          onDirectoryChanged={directory.reload}
        />
      ) : undefined}
      {selectedSectionId === "enrolments" ? (
        <EnrolmentsSection
          organizationName={profile.organizationName}
          people={directory.people}
          courses={directory.courses}
          enrolments={directory.enrolments}
          isLoading={directory.isLoadingEnrolments}
          isLoadingPeople={directory.isLoadingPeople}
          isLoadingCourses={directory.isLoadingCourses}
          onEnrolmentsChange={directory.updateEnrolments}
          onDirectoryChanged={directory.reload}
        />
      ) : undefined}
    </section>
  );
}
