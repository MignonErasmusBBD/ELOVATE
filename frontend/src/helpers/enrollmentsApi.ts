import { ElovateApiError, fetchElovateApi } from "./elovateApi";
import {
  isPlainObject,
  readErrorMessage,
  readObjectList,
  readRequiredString,
} from "./jsonFields";

export type EnrollmentSummary = {
  id: string;
  courseId: string;
  status: string;
};

function parseEnrollment(item: unknown): EnrollmentSummary | undefined {
  if (!isPlainObject(item)) return undefined;
  const id = readRequiredString(item, "id");
  const courseId = readRequiredString(item, "courseId");
  const status = readRequiredString(item, "status");
  if (id === undefined || courseId === undefined || status === undefined) {
    return undefined;
  }
  return { id, courseId, status };
}

export async function listMyEnrollments(
  status?: string,
): Promise<EnrollmentSummary[]> {
  const path =
    status !== undefined
      ? `/enrollments/me?status=${status}`
      : "/enrollments/me";
  const response = await fetchElovateApi(path);
  if (response.ok === false) {
    const body: unknown = await response.json().catch(() => undefined);
    throw new ElovateApiError(
      response.status,
      readErrorMessage(body, "Could not load enrollments."),
    );
  }
  const body: unknown = await response.json();
  if (!isPlainObject(body)) return [];
  const items = readObjectList(body, "items");
  return items.flatMap((item) => {
    const e = parseEnrollment(item);
    return e !== undefined ? [e] : [];
  });
}

export async function startCommunityEnrollment(
  courseId: string,
): Promise<EnrollmentSummary> {
  const response = await fetchElovateApi("/enrollments/start-community", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseId }),
  });
  const body: unknown = await response.json().catch(() => undefined);
  if (response.ok === false) {
    throw new ElovateApiError(
      response.status,
      readErrorMessage(body, "Could not enrol in course."),
    );
  }
  const enrollment = parseEnrollment(body);
  if (enrollment === undefined) throw new Error("Enrol response was invalid.");
  return enrollment;
}
