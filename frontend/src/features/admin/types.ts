export type CourseVisibility = "private" | "community";

export type CompanyStatus = "active" | "suspended";

export type AdminPerson = {
  id: string;
  organizationId: string | undefined;
  emailAddress: string;
  fullName: string;
  roleNames: string[];
};

export type DirectoryOrganization = {
  id: string;
  name: string;
  slug: string;
  status: CompanyStatus;
};

export type DirectoryRole = {
  roleName: string;
  description: string | undefined;
};

export type AdminCourse = {
  id: string;
  owningOrganizationId: string;
  owningOrganizationName: string;
  title: string;
  description: string;
  visibility: CourseVisibility;
  authorFullName?: string;
};

export type AdminEnrolment = {
  id: string;
  userId: string;
  userFullName: string;
  courseId: string;
  courseTitle: string;
};

export type OrganisationSettings = {
  id: string;
  name: string;
  slug: string;
};

export type AdminCompany = {
  id: string;
  name: string;
  status: CompanyStatus;
  adminFullNames: string[];
};

export type RoleAssignmentScope = "platform" | "organisation";

export type AdminRole = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissionCodes: string[];
  assignmentScope: RoleAssignmentScope;
};

export type OrgAdminSectionId = "people" | "courses" | "enrolments";

export type PlatformAdminSectionId = "companies" | "roles";
