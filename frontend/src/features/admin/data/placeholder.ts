import type {
  AdminCompany,
  AdminCourse,
  AdminEnrolment,
  AdminPerson,
  AdminRole,
  OrganisationSettings,
} from "../types";

export const currentOrganisation: OrganisationSettings = {
  id: "org-bbd",
  name: "BBD Software",
  slug: "bbd-software",
};

export const adminPeople: AdminPerson[] = [
  {
    id: "user-mignon",
    organizationId: "org-bbd",
    emailAddress: "mignon.erasmus@bbd.co.za",
    fullName: "Mignon Erasmus",
    roleNames: ["Org Admin", "Learner"],
  },
  {
    id: "user-sam",
    organizationId: "org-bbd",
    emailAddress: "sam.okonkwo@elovate.dev",
    fullName: "Sam Okonkwo",
    roleNames: ["Platform Admin", "Learner"],
  },
  {
    id: "user-tessa",
    organizationId: "org-acme",
    emailAddress: "tessa.engelbrecht@bbd.co.za",
    fullName: "Tessa Engelbrecht",
    roleNames: ["Org Admin", "Educator", "Learner"],
  },
  {
    id: "user-xadrian",
    organizationId: "org-bbd",
    emailAddress: "xadrian.vanheerden@bbd.co.za",
    fullName: "Xadrian van Heerden",
    roleNames: ["Community Admin", "Learner"],
  },
  {
    id: "user-jordan",
    organizationId: "org-bbd",
    emailAddress: "jordan.naidoo@bbd.co.za",
    fullName: "Jordan Naidoo",
    roleNames: ["Educator", "Learner"],
  },
  {
    id: "user-priya",
    organizationId: "org-acme",
    emailAddress: "priya.shah@acme.dev",
    fullName: "Priya Shah",
    roleNames: ["Community Admin", "Learner"],
  },
  {
    id: "user-alex",
    organizationId: "org-northwind",
    emailAddress: "alex.learner@northwind.dev",
    fullName: "Alex Learner",
    roleNames: ["Org Admin", "Learner"],
  },
];

export const adminCourses: AdminCourse[] = [
  {
    id: "clean-code-principles",
    owningOrganizationId: "org-bbd",
    owningOrganizationName: "BBD Software",
    title: "Clean Code Principles",
    description:
      "Write readable, maintainable code following industry best practices.",
    visibility: "private",
    authorFullName: "Jordan Naidoo",
  },
  {
    id: "api-design-development",
    owningOrganizationId: "org-bbd",
    owningOrganizationName: "BBD Software",
    title: "API Design & Development",
    description: "Build robust and well-documented RESTful APIs from scratch.",
    visibility: "private",
    authorFullName: "Jordan Naidoo",
  },
  {
    id: "master-design-patterns",
    owningOrganizationId: "org-bbd",
    owningOrganizationName: "BBD Software",
    title: "Master Design Patterns",
    description:
      "Learn industry-standard design patterns to write better, more maintainable code.",
    visibility: "community",
  },
  {
    id: "system-design-fundamentals",
    owningOrganizationId: "org-bbd",
    owningOrganizationName: "BBD Software",
    title: "System Design Fundamentals",
    description:
      "Learn to design scalable, reliable, and maintainable software systems.",
    visibility: "community",
  },
];

export const adminEnrolments: AdminEnrolment[] = [
  {
    id: "enrol-xadrian-clean-code",
    userId: "user-xadrian",
    userFullName: "Xadrian van Heerden",
    courseId: "clean-code-principles",
    courseTitle: "Clean Code Principles",
  },
  {
    id: "enrol-sam-api",
    userId: "user-sam",
    userFullName: "Sam Okonkwo",
    courseId: "api-design-development",
    courseTitle: "API Design & Development",
  },
];

export const adminCompanies: AdminCompany[] = [
  {
    id: "org-bbd",
    name: "BBD Software",
    status: "active",
    adminFullNames: ["Mignon Erasmus"],
  },
  {
    id: "org-acme",
    name: "Acme Learning",
    status: "active",
    adminFullNames: ["Tessa Engelbrecht", "Xadrian van Heerden"],
  },
  {
    id: "org-northwind",
    name: "Northwind Academy",
    status: "suspended",
    adminFullNames: ["Alex Learner"],
  },
];

export const adminRoles: AdminRole[] = [
  {
    id: "role-learner",
    name: "learner",
    displayName: "Learner",
    description: "Take community courses, assigned private courses, and own progress.",
    permissionCodes: [
      "course.community.read",
      "enrollment.read.self",
      "quiz.attempt",
    ],
    assignmentScope: "organisation",
  },
  {
    id: "role-educator",
    name: "instructor",
    displayName: "Educator",
    description: "Author content, publish community courses, view org insights.",
    permissionCodes: [
      "course.community.create",
      "course.private.create",
      "analytics.read.org",
    ],
    assignmentScope: "organisation",
  },
  {
    id: "role-org-admin",
    name: "org_admin",
    displayName: "Org Admin",
    description: "Invite users, manage private courses, enrol people, org settings.",
    permissionCodes: [
      "user.invite",
      "role.assign",
      "enrollment.assign",
      "org.update.self",
    ],
    assignmentScope: "organisation",
  },
  {
    id: "role-platform-admin",
    name: "platform_admin",
    displayName: "Platform Admin",
    description: "Overarching admin across every organisation: create and suspend organisations, and manage global roles.",
    permissionCodes: [
      "org.create",
      "org.suspend",
      "org.read.all",
      "role.catalogue.write",
    ],
    assignmentScope: "platform",
  },
  {
    id: "role-community-admin",
    name: "community_admin",
    displayName: "Community Admin",
    description:
      "Curate public courses available to every learner. Only this role can deactivate community courses.",
    permissionCodes: [
      "course.community.update",
      "course.community.delete",
      "course.community.publish",
    ],
    assignmentScope: "platform",
  },
];
