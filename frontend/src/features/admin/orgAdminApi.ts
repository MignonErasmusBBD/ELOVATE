import { elovateApiJson } from "@/helpers/elovateApi";
import {
  parseAdminEnrolment,
  parseAdminEnrolments,
  parseDirectoryPeople,
  parseDirectoryPerson,
  parseAdminCourse,
  parseAdminCourses,
} from "./parseDirectory";
import type {
  AdminEnrolment,
  AdminPerson,
  CourseStatus,
  AdminCourse,
  PersonStatus,
} from "./types";

export async function listUnassignedPeople(): Promise<AdminPerson[]> {
  const body = await elovateApiJson("/users?unassigned=true");
  return parseDirectoryPeople(body);
}

export async function placePersonInOrganisation(
  userId: string,
): Promise<AdminPerson | undefined> {
  const body = await elovateApiJson(`/users/${userId}/place`, {
    method: "POST",
  });
  return parseDirectoryPerson(body);
}

export async function setPersonStatus(
  userId: string,
  status: PersonStatus,
) {
  const action = status === "active" ? "activate" : "deactivate";
  await elovateApiJson(`/users/${userId}/${action}`, {
    method: "POST",
  });
}

export async function listOrgPrivateCourses(
  organizationId: string,
): Promise<AdminCourse[]> {
  const query = new URLSearchParams({
    visibility: "private",
    status: "all",
    organizationId,
  });
  const body = await elovateApiJson(`/courses?${query.toString()}`);
  return parseAdminCourses(body);
}

export async function createOrgPrivateCourse(
  organizationId: string,
  title: string,
  description: string | undefined,
): Promise<AdminCourse | undefined> {
  const requestBody: {
    title: string;
    visibility: "private";
    organizationId: string;
    description?: string;
  } = {
    title,
    visibility: "private",
    organizationId,
  };
  if (description !== undefined && description !== "") {
    requestBody.description = description;
  }
  const body = await elovateApiJson("/courses", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
  return parseAdminCourse(body);
}

export async function setCourseStatus(
  courseId: string,
  status: CourseStatus,
) {
  const action = status === "active" ? "activate" : "deactivate";
  await elovateApiJson(`/courses/${courseId}/${action}`, {
    method: "POST",
  });
}

export async function listOrgEnrolments(): Promise<AdminEnrolment[]> {
  const body = await elovateApiJson("/enrollments");
  return parseAdminEnrolments(body);
}

export async function assignEnrolment(
  userId: string,
  courseId: string,
  requirement: { isRequired: boolean; dueAt: string | undefined },
): Promise<AdminEnrolment | undefined> {
  const requestBody: {
    userId: string;
    courseId: string;
    isRequired: boolean;
    dueAt?: string;
  } = {
    userId,
    courseId,
    isRequired: requirement.isRequired,
  };
  if (requirement.dueAt !== undefined && requirement.dueAt !== "") {
    requestBody.dueAt = requirement.dueAt;
  }
  const body = await elovateApiJson("/enrollments/assign", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
  return parseAdminEnrolment(body);
}

export async function updateEnrolmentRequirement(
  enrolmentId: string,
  requirement: { isRequired: boolean; dueAt: string | undefined },
): Promise<AdminEnrolment | undefined> {
  const requestBody: { isRequired: boolean; dueAt?: string } = {
    isRequired: requirement.isRequired,
  };
  if (requirement.dueAt !== undefined && requirement.dueAt !== "") {
    requestBody.dueAt = requirement.dueAt;
  }
  const body = await elovateApiJson(`/enrollments/${enrolmentId}/requirement`, {
    method: "PATCH",
    body: JSON.stringify(requestBody),
  });
  return parseAdminEnrolment(body);
}

export async function withdrawEnrolment(enrolmentId: string) {
  await elovateApiJson(`/enrollments/${enrolmentId}/withdraw`, {
    method: "POST",
  });
}

export async function activateEnrolment(enrolmentId: string) {
  await elovateApiJson(`/enrollments/${enrolmentId}/activate`, {
    method: "POST",
  });
}
