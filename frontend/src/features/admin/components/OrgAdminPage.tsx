"use client";

import { useState } from "react";
import type { OrgAdminSectionId } from "../types";
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
  const [selectedSectionId, setSelectedSectionId] =
    useState<OrgAdminSectionId>("people");

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
      <AdminPageHeader
        title="Organisational Admin"
        description="Invite people, assign Organisational Admin and Educator, and manage private courses."
      />
      <AdminSectionNav
        items={orgAdminSections}
        selectedSectionId={selectedSectionId}
        onSelectSection={setSelectedSectionId}
      />
      {selectedSectionId === "people" ? <PeopleSection /> : undefined}
      {selectedSectionId === "courses" ? <AdminCoursesSection /> : undefined}
      {selectedSectionId === "enrolments" ? <EnrolmentsSection /> : undefined}
    </section>
  );
}
