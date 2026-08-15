import { elovateApiJson } from "@/helpers/elovateApi";
import { parseDirectoryOrganization } from "./parseDirectory";
import type { DirectoryOrganization } from "./types";

export async function createOrganisation(input: {
  name: string;
  adminUserIds: string[];
}): Promise<DirectoryOrganization | undefined> {
  const body = await elovateApiJson("/organizations", {
    method: "POST",
    body: JSON.stringify({
      name: input.name.trim(),
      adminUserIds: input.adminUserIds,
    }),
  });
  return parseDirectoryOrganization(body);
}

export async function setOrganisationStatus(
  organizationId: string,
  status: "active" | "suspended",
) {
  const action = status === "active" ? "activate" : "suspend";
  await elovateApiJson(`/organizations/${organizationId}/${action}`, {
    method: "POST",
  });
}

export async function placeUserInOrganisation(
  organizationId: string,
  userId: string,
) {
  await elovateApiJson(`/organizations/${organizationId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function removeUserFromOrganisation(
  organizationId: string,
  userId: string,
) {
  await elovateApiJson(`/organizations/${organizationId}/members/remove`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function assignRole(userId: string, roleName: string) {
  await elovateApiJson("/rbac/assignments", {
    method: "POST",
    body: JSON.stringify({ userId, roleName }),
  });
}

export async function unassignRole(userId: string, roleName: string) {
  await elovateApiJson("/rbac/assignments/remove", {
    method: "POST",
    body: JSON.stringify({ userId, roleName }),
  });
}

export function addedIds(previousIds: string[], nextIds: string[]): string[] {
  return nextIds.filter((id) => previousIds.includes(id) === false);
}

export function removedIds(previousIds: string[], nextIds: string[]): string[] {
  return previousIds.filter((id) => nextIds.includes(id) === false);
}
