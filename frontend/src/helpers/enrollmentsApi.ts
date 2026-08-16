import {
  ElovateApiError,
  fetchElovateApi,
} from "@/helpers/elovateApi";
import {
  isPlainObject,
  readErrorMessage,
  readObjectList,
  readRequiredString,
} from "@/helpers/jsonFields";

export type EnrollmentStatus = "active" | "completed" | "withdrawn";

export type EnrollmentSummary = {
  id: string;
  courseId: string;
  status: string;
};

export type ElovateEnrollment = {
  id: string;
  userId: string;
  courseId: string;
  organizationId?: string;
  enrolledAt: string;
  status: EnrollmentStatus;
  userFullName: string;
  emailAddress: string;
  courseTitle: string;
  practiceAttemptCount: number;
  practiceQuizPercent?: number;
};

export type ListEnrollmentsInput = {
  courseId: string;
  status?: EnrollmentStatus;
};

function parseEnrollmentStatus(
  value: string | undefined,
): EnrollmentStatus | undefined {
  if (value === "active" || value === "completed" || value === "withdrawn") {
    return value;
  }
  return undefined;
}

function readEnrolledAt(body: object): string | undefined {
  if ("enrolledAt" in body === false) {
    return undefined;
  }
  const field = Reflect.get(body, "enrolledAt");
  if (typeof field === "string" && field !== "") {
    return field;
  }
  return undefined;
}

function readOptionalNumber(
  body: object,
  key: string,
): number | undefined {
  if (key in body === false) {
    return undefined;
  }
  const field = Reflect.get(body, key);
  if (typeof field !== "number" || Number.isFinite(field) === false) {
    return undefined;
  }
  return field;
}

function parseEnrollmentSummary(item: unknown): EnrollmentSummary | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }
  const id = readRequiredString(item, "id");
  const courseId = readRequiredString(item, "courseId");
  const status = readRequiredString(item, "status");
  if (id === undefined || courseId === undefined || status === undefined) {
    return undefined;
  }
  return { id, courseId, status };
}

export function parseElovateEnrollment(
  item: unknown,
): ElovateEnrollment | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }

  const id = readRequiredString(item, "id");
  const userId = readRequiredString(item, "userId");
  const courseId = readRequiredString(item, "courseId");
  const enrolledAt = readEnrolledAt(item);
  const status = parseEnrollmentStatus(readRequiredString(item, "status"));
  const userFullName = readRequiredString(item, "userFullName");
  const emailAddress = readRequiredString(item, "emailAddress");
  const courseTitle = readRequiredString(item, "courseTitle");
  const practiceAttemptCount = readOptionalNumber(item, "practiceAttemptCount");
  const practiceQuizPercent = readOptionalNumber(item, "practiceQuizPercent");

  if (
    id === undefined ||
    userId === undefined ||
    courseId === undefined ||
    enrolledAt === undefined ||
    status === undefined ||
    userFullName === undefined ||
    emailAddress === undefined ||
    courseTitle === undefined
  ) {
    return undefined;
  }

  return {
    id,
    userId,
    courseId,
    organizationId: readRequiredString(item, "organizationId"),
    enrolledAt,
    status,
    userFullName,
    emailAddress,
    courseTitle,
    practiceAttemptCount:
      practiceAttemptCount === undefined ? 0 : practiceAttemptCount,
    practiceQuizPercent,
  };
}

function parseEnrollmentList(body: unknown): ElovateEnrollment[] | undefined {
  if (isPlainObject(body) === false) {
    return undefined;
  }
  const items = readObjectList(body, "items");
  const enrollments: ElovateEnrollment[] = [];
  for (const item of items) {
    const enrollment = parseElovateEnrollment(item);
    if (enrollment !== undefined) {
      enrollments.push(enrollment);
    }
  }
  return enrollments;
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
  if (isPlainObject(body) === false) {
    return [];
  }
  const items = readObjectList(body, "items");
  const enrollments: EnrollmentSummary[] = [];
  for (const item of items) {
    const enrollment = parseEnrollmentSummary(item);
    if (enrollment !== undefined) {
      enrollments.push(enrollment);
    }
  }
  return enrollments;
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
  const enrollment = parseEnrollmentSummary(body);
  if (enrollment === undefined) {
    throw new Error("Enrol response was invalid.");
  }
  return enrollment;
}

export async function listCourseEnrollments(
  input: ListEnrollmentsInput,
): Promise<ElovateEnrollment[]> {
  const queryParams = new URLSearchParams({ courseId: input.courseId });
  if (input.status !== undefined) {
    queryParams.set("status", input.status);
  }

  const response = await fetchElovateApi(
    `/enrollments?${queryParams.toString()}`,
  );
  const responseBody: unknown = await response.json();
  if (response.ok === false) {
    throw new ElovateApiError(
      response.status,
      readErrorMessage(responseBody, "Could not load enrollments."),
    );
  }

  const enrollments = parseEnrollmentList(responseBody);
  if (enrollments === undefined) {
    throw new Error("Enrollment list response was invalid.");
  }
  return enrollments;
}

export function formatEnrollmentDate(isoDate: string): string {
  const parsedDate = new Date(isoDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return isoDate;
  }
  return parsedDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
