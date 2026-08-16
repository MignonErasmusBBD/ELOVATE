import {
  isPlainObject,
  readObjectList,
  readOptionalBoolean,
  readOptionalNumber,
  readOptionalString,
  readRequiredString,
  readStringList,
} from "@/helpers/jsonFields";
import type {
  AdminEnrolment,
  AdminPerson,
  CompanyStatus,
  DirectoryOrganization,
  DirectoryRole,
  EnrolmentStatus,
  AdminCourse,
  PersonStatus,
} from "./types";

function readPersonStatus(body: object): PersonStatus {
  const status = readRequiredString(body, "status");
  if (status === "deactivated") {
    return "deactivated";
  }
  return "active";
}

function readEnrolmentStatus(body: object): EnrolmentStatus | undefined {
  const status = readRequiredString(body, "status");
  if (
    status === "active" ||
    status === "completed" ||
    status === "withdrawn" ||
    status === "overdue"
  ) {
    return status;
  }
  return undefined;
}

function readCompanyStatus(body: object): CompanyStatus | undefined {
  const status = readRequiredString(body, "status");
  if (status === "active" || status === "suspended") {
    return status;
  }
  return undefined;
}

export function parseDirectoryOrganization(
  body: unknown,
): DirectoryOrganization | undefined {
  if (isPlainObject(body) === false) {
    return undefined;
  }
  const id = readRequiredString(body, "id");
  const name = readRequiredString(body, "name");
  const slug = readRequiredString(body, "slug");
  const status = readCompanyStatus(body);
  if (
    id === undefined ||
    name === undefined ||
    slug === undefined ||
    status === undefined
  ) {
    return undefined;
  }
  return { id, name, slug, status };
}

export function parseDirectoryOrganizations(
  body: unknown,
): DirectoryOrganization[] {
  if (isPlainObject(body) === false) {
    return [];
  }
  const organizations: DirectoryOrganization[] = [];
  for (const item of readObjectList(body, "items")) {
    const organization = parseDirectoryOrganization(item);
    if (organization !== undefined) {
      organizations.push(organization);
    }
  }
  return organizations;
}

export function previewSlugFromName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug === "") {
    return "organisation";
  }
  return slug;
}

export function parseDirectoryPerson(
  body: unknown,
): AdminPerson | undefined {
  if (isPlainObject(body) === false) {
    return undefined;
  }
  const id = readRequiredString(body, "id");
  const emailAddress = readRequiredString(body, "email");
  if (id === undefined || emailAddress === undefined) {
    return undefined;
  }
  const fullName = readOptionalString(body, "fullName");
  return {
    id,
    organizationId: readOptionalString(body, "organizationId"),
    emailAddress,
    fullName: fullName ?? emailAddress,
    status: readPersonStatus(body),
    roleNames: readStringList(body, "roles"),
  };
}

export function parseDirectoryPeople(body: unknown): AdminPerson[] {
  if (isPlainObject(body) === false) {
    return [];
  }
  const people: AdminPerson[] = [];
  for (const item of readObjectList(body, "items")) {
    const person = parseDirectoryPerson(item);
    if (person !== undefined) {
      people.push(person);
    }
  }
  return people;
}

export function parseDirectoryRoles(body: unknown): DirectoryRole[] {
  if (isPlainObject(body) === false) {
    return [];
  }
  const roles: DirectoryRole[] = [];
  for (const item of readObjectList(body, "items")) {
    const roleName = readRequiredString(item, "roleName");
    if (roleName === undefined) {
      continue;
    }
    roles.push({
      roleName,
      description: readOptionalString(item, "description"),
    });
  }
  return roles;
}

export function peopleAvailableForOrganisationAdmin(
  people: AdminPerson[],
  selectedPersonIds: string[],
): AdminPerson[] {
  return people.filter((person) => {
    if (selectedPersonIds.includes(person.id)) {
      return true;
    }
    return person.organizationId === undefined;
  });
}

export function personSelectOptions(people: AdminPerson[]) {
  return people.map((person) => ({
    id: person.id,
    label: person.fullName,
    description: person.emailAddress,
  }));
}

export function peopleWithRole(
  people: AdminPerson[],
  roleName: string,
): string[] {
  return people
    .filter((person) => person.roleNames.includes(roleName))
    .map((person) => person.id);
}

export function organisationAdminIds(
  people: AdminPerson[],
  organizationId: string,
): string[] {
  return people
    .filter(
      (person) =>
        person.organizationId === organizationId &&
        person.roleNames.includes("org_admin"),
    )
    .map((person) => person.id);
}

export function withAssignedRole(
  people: AdminPerson[],
  userIds: string[],
  roleName: string,
): AdminPerson[] {
  return people.map((person) => {
    if (userIds.includes(person.id) === false) {
      return person;
    }
    if (person.roleNames.includes(roleName)) {
      return person;
    }
    return {
      ...person,
      roleNames: [...person.roleNames, roleName],
    };
  });
}

export function withoutAssignedRole(
  people: AdminPerson[],
  userIds: string[],
  roleName: string,
): AdminPerson[] {
  return people.map((person) => {
    if (userIds.includes(person.id) === false) {
      return person;
    }
    return {
      ...person,
      roleNames: person.roleNames.filter((name) => name !== roleName),
    };
  });
}

export function withOrganisationAdmin(
  people: AdminPerson[],
  organizationId: string,
  userIds: string[],
): AdminPerson[] {
  return people.map((person) => {
    if (userIds.includes(person.id) === false) {
      return person;
    }
    const roleNames = person.roleNames.includes("org_admin")
      ? person.roleNames
      : [...person.roleNames, "org_admin"];
    return {
      ...person,
      organizationId,
      roleNames,
    };
  });
}

export function withoutOrganisationMembership(
  people: AdminPerson[],
  userIds: string[],
): AdminPerson[] {
  return people.map((person) => {
    if (userIds.includes(person.id) === false) {
      return person;
    }
    return {
      ...person,
      organizationId: undefined,
      roleNames: person.roleNames.filter((name) => name !== "org_admin"),
    };
  });
}

export function parseAdminCourse(
  body: unknown,
): AdminCourse | undefined {
  if (isPlainObject(body) === false) {
    return undefined;
  }
  const id = readRequiredString(body, "id");
  const title = readRequiredString(body, "title");
  if (id === undefined || title === undefined) {
    return undefined;
  }
  const statusValue = readRequiredString(body, "status");
  let status: AdminCourse["status"] = "active";
  if (statusValue === "deactivated") {
    status = "deactivated";
  }
  if (statusValue === "draft") {
    status = "draft";
  }
  const sectionCount = readOptionalNumber(body, "sectionCount");
  const activeQuestionCount = readOptionalNumber(body, "activeQuestionCount");
  return {
    id,
    title,
    description: readOptionalString(body, "description"),
    status,
    sectionCount: sectionCount === undefined ? 0 : sectionCount,
    activeQuestionCount:
      activeQuestionCount === undefined ? 0 : activeQuestionCount,
  };
}

export function parseAdminCourses(body: unknown): AdminCourse[] {
  if (isPlainObject(body) === false) {
    return [];
  }
  const courses: AdminCourse[] = [];
  for (const item of readObjectList(body, "items")) {
    const course = parseAdminCourse(item);
    if (course !== undefined) {
      courses.push(course);
    }
  }
  return courses;
}

export function parseAdminEnrolment(
  body: unknown,
): AdminEnrolment | undefined {
  if (isPlainObject(body) === false) {
    return undefined;
  }
  const id = readRequiredString(body, "id");
  const userId = readRequiredString(body, "userId");
  const courseId = readRequiredString(body, "courseId");
  const userFullName = readRequiredString(body, "userFullName");
  const courseTitle = readRequiredString(body, "courseTitle");
  const status = readEnrolmentStatus(body);
  if (
    id === undefined ||
    userId === undefined ||
    courseId === undefined ||
    userFullName === undefined ||
    courseTitle === undefined ||
    status === undefined
  ) {
    return undefined;
  }
  const isRequired = readOptionalBoolean(body, "isRequired");
  return {
    id,
    userId,
    userFullName,
    courseId,
    courseTitle,
    status,
    isRequired: isRequired === true,
    dueAt: readOptionalString(body, "dueAt"),
  };
}

export function parseAdminEnrolments(body: unknown): AdminEnrolment[] {
  if (isPlainObject(body) === false) {
    return [];
  }
  const enrolments: AdminEnrolment[] = [];
  for (const item of readObjectList(body, "items")) {
    const enrolment = parseAdminEnrolment(item);
    if (enrolment !== undefined) {
      enrolments.push(enrolment);
    }
  }
  return enrolments;
}

export { displayRoleName } from "@/helpers/displayLabels";

export function organisationAdminNames(
  people: AdminPerson[],
  organizationId: string,
): string[] {
  return people
    .filter(
      (person) =>
        person.organizationId === organizationId &&
        person.roleNames.includes("org_admin"),
    )
    .map((person) => person.fullName);
}
