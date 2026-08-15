export type CurrentUserProfile = {
  id: string;
  organizationId?: string;
  organizationName?: string;
  email: string;
  fullName?: string;
  status: string;
  roles: string[];
  permissionCodes: string[];
};

function readOptionalString(body: object, key: string): string | undefined {
  if (key in body === false) {
    return undefined;
  }
  const field = Reflect.get(body, key);
  if (typeof field !== "string" || field === "") {
    return undefined;
  }
  return field;
}

function readRequiredString(body: object, key: string): string | undefined {
  const value = readOptionalString(body, key);
  return value;
}

function readStringList(body: object, key: string): string[] {
  if (key in body === false) {
    return [];
  }
  const field = Reflect.get(body, key);
  if (Array.isArray(field) === false) {
    return [];
  }
  const values: string[] = [];
  for (const item of field) {
    if (typeof item === "string" && item !== "") {
      values.push(item);
    }
  }
  return values;
}

export function parseCurrentUserProfile(
  body: unknown,
): CurrentUserProfile | undefined {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return undefined;
  }

  const id = readRequiredString(body, "id");
  const email = readRequiredString(body, "email");
  const status = readRequiredString(body, "status");
  if (id === undefined || email === undefined || status === undefined) {
    return undefined;
  }

  return {
    id,
    email,
    status,
    organizationId: readOptionalString(body, "organizationId"),
    organizationName: readOptionalString(body, "organizationName"),
    fullName: readOptionalString(body, "fullName"),
    roles: readStringList(body, "roles"),
    permissionCodes: readStringList(body, "permissionCodes"),
  };
}

export function userHasAnyRole(
  roleNames: string[],
  requiredRoleNames: string[],
): boolean {
  return requiredRoleNames.some((requiredRoleName) =>
    roleNames.includes(requiredRoleName),
  );
}

export const EDUCATOR_PAGE_ROLES = ["educator", "community_admin"] as const;
export const ORG_ADMIN_PAGE_ROLES = ["org_admin"] as const;
export const PLATFORM_ADMIN_PAGE_ROLES = ["platform_admin"] as const;
