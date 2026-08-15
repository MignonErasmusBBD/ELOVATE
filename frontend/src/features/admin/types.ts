export type CompanyStatus = "active" | "suspended";

export type PersonStatus = "active" | "deactivated";

export type EnrolmentStatus = "active" | "completed" | "withdrawn";

export type AdminPerson = {
  id: string;
  organizationId: string | undefined;
  emailAddress: string;
  fullName: string;
  status: PersonStatus;
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

export type AdminEnrolment = {
  id: string;
  userId: string;
  userFullName: string;
  courseId: string;
  courseTitle: string;
  status: EnrolmentStatus;
};

export type CourseStatus = "active" | "deactivated";

export type OrgPrivateCourse = {
  id: string;
  title: string;
  description: string | undefined;
  status: CourseStatus;
};

export type OrgAdminSectionId = "people" | "courses" | "enrolments";

export type PlatformAdminSectionId = "companies" | "roles";
