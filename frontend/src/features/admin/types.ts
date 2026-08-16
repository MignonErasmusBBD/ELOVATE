export type CompanyStatus = "active" | "suspended";

export type PersonStatus = "active" | "deactivated";

export type EnrolmentStatus = "active" | "completed" | "withdrawn" | "overdue";

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
  isRequired: boolean;
  dueAt: string | undefined;
};

export type CourseStatus = "active" | "deactivated" | "draft";

export type AdminCourse = {
  id: string;
  title: string;
  description: string | undefined;
  status: CourseStatus;
  sectionCount: number;
  activeQuestionCount: number;
};

export type OrgAdminSectionId = "people" | "courses" | "enrolments";

export type PlatformAdminSectionId = "companies" | "roles";
