import {
  isPlainObject,
  readObjectList,
  readOptionalString,
  readRequiredString,
  readStringList,
} from "@/helpers/jsonFields";
import type {
  AdminPerson,
  CompanyStatus,
  DirectoryOrganization,
  DirectoryRole,
} from "./types";

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

export function parseDirectoryPeople(body: unknown): AdminPerson[] {
  if (isPlainObject(body) === false) {
    return [];
  }
  const people: AdminPerson[] = [];
  for (const item of readObjectList(body, "items")) {
    const id = readRequiredString(item, "id");
    const emailAddress = readRequiredString(item, "email");
    if (id === undefined || emailAddress === undefined) {
      continue;
    }
    const fullName = readOptionalString(item, "fullName");
    people.push({
      id,
      organizationId: readOptionalString(item, "organizationId"),
      emailAddress,
      fullName: fullName ?? emailAddress,
      roleNames: readStringList(item, "roles"),
    });
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
