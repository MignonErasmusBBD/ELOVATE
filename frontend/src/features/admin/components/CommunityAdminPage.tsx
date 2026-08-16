"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/platform";
import { PAGE_SHELL_CLASS } from "@/helpers/pageLayout";
import {
  COMMUNITY_ADMIN_PAGE_ROLES,
  userHasAnyRole,
} from "@/helpers/currentUserProfile";
import { createCommunityCourse } from "../communityAdminApi";
import { useCommunityAdminDirectory } from "../useCommunityAdminDirectory";
import { AdminCoursesSection } from "./AdminCoursesSection";
import { AdminPageHeader } from "./AdminPageHeader";

export function CommunityAdminPage() {
  const router = useRouter();
  const {
    profile,
    isLoading: isProfileLoading,
    errorMessage: profileErrorMessage,
  } = useCurrentUser();
  const canAccessCommunityAdminPage =
    profile === undefined
      ? false
      : userHasAnyRole(profile.roles, [...COMMUNITY_ADMIN_PAGE_ROLES]);
  const directory = useCommunityAdminDirectory(canAccessCommunityAdminPage);

  useEffect(() => {
    if (isProfileLoading) {
      return;
    }
    if (profile === undefined) {
      return;
    }
    if (canAccessCommunityAdminPage === false) {
      router.replace("/courses");
    }
  }, [canAccessCommunityAdminPage, isProfileLoading, profile, router]);

  if (isProfileLoading || profile === undefined) {
    return (
      <section className={PAGE_SHELL_CLASS}>
        <p className="text-sm text-text-secondary">
          {profileErrorMessage ?? "Loading account…"}
        </p>
      </section>
    );
  }

  if (canAccessCommunityAdminPage === false) {
    return undefined;
  }

  return (
    <section className={PAGE_SHELL_CLASS}>
      <AdminPageHeader
        title="Community Admin"
        description="Add and curate public courses available to every learner. Deactivating a course hides it from the shared catalogue."
      />
      {directory.errorMessage === undefined ? undefined : (
        <p className="mt-6 text-sm text-coral" role="alert">
          {directory.errorMessage}
        </p>
      )}
      <AdminCoursesSection
        heading="Public courses"
        description="These courses appear in the shared catalogue for everyone, across organisations."
        emptyMessage="No public courses yet. Add one above."
        titleFieldId="community-course-title"
        titlePlaceholder="Public course title"
        descriptionFieldId="community-course-description"
        searchInputId="community-courses-search"
        visibilityLabel="Community"
        canCreate={true}
        createBlockedMessage={undefined}
        courses={directory.courses}
        isLoading={directory.isLoadingCourses}
        onCreate={createCommunityCourse}
        onCoursesChange={directory.updateCourses}
        onDirectoryChanged={directory.reload}
      />
    </section>
  );
}
