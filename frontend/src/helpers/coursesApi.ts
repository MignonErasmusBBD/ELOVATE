import { ElovateApiError, fetchElovateApi } from "@/helpers/elovateApi";
import { readOptionalBoolean, readOptionalNumber } from "@/helpers/jsonFields";

export type ElovateCourseStatus = "active" | "deactivated" | "draft";

export type ElovateCourseSummary = {
  id: string;
  title: string;
  status?: ElovateCourseStatus;
  description?: string;
  visibility?: string;
  organizationId?: string;
  sectionCount?: number;
  activeQuestionCount?: number;
  isEnrolled?: boolean;
  isRequired?: boolean;
  dueAt?: string;
};

const courseInFlight = new Map<
  string,
  Promise<ElovateCourseSummary | undefined>
>();

export type CreateCourseInput = {
  title: string;
  description?: string;
  visibility: "private" | "community";
  organizationId?: string;
};

export type ListCoursesInput = {
  visibility?: "private" | "community";
  organizationId?: string;
  status?: ElovateCourseStatus | "all";
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

export function parseCourseSummary(
  item: unknown,
): ElovateCourseSummary | undefined {
  if (typeof item !== "object" || item === null || Array.isArray(item)) {
    return undefined;
  }

  const id = readOptionalString(item, "id");
  const title = readOptionalString(item, "title");
  if (id === undefined || title === undefined) {
    return undefined;
  }

  const statusValue = readOptionalString(item, "status");
  let status: ElovateCourseStatus | undefined;
  if (
    statusValue === "active" ||
    statusValue === "deactivated" ||
    statusValue === "draft"
  ) {
    status = statusValue;
  }

  return {
    id,
    title,
    description: readOptionalString(item, "description"),
    visibility: readOptionalString(item, "visibility"),
    organizationId: readOptionalString(item, "organizationId"),
    status,
    sectionCount: readOptionalNumber(item, "sectionCount"),
    activeQuestionCount: readOptionalNumber(item, "activeQuestionCount"),
    isEnrolled: readOptionalBoolean(item, "isEnrolled"),
    isRequired: readOptionalBoolean(item, "isRequired"),
    dueAt: readOptionalString(item, "dueAt"),
  };
}

export async function listCourses(
  input?: ListCoursesInput,
): Promise<ElovateCourseSummary[]> {
  const queryParams = new URLSearchParams();
  if (input?.visibility !== undefined) {
    queryParams.set("visibility", input.visibility);
  }
  if (input?.organizationId !== undefined) {
    queryParams.set("organizationId", input.organizationId);
  }
  if (input?.status !== undefined) {
    queryParams.set("status", input.status);
  }

  const queryString = queryParams.toString();
  const coursesResponse = await fetchElovateApi(
    queryString === "" ? "/courses" : `/courses?${queryString}`,
  );
  if (coursesResponse.ok === false) {
    throw new Error("Could not load courses.");
  }

  const coursesBody = await coursesResponse.json();
  const parsedCourses = parseCourseListResponse(coursesBody);
  if (parsedCourses === undefined) {
    throw new Error("Course list response was invalid.");
  }

  return parsedCourses;
}

export function parseCourseListResponse(
  body: unknown,
): ElovateCourseSummary[] | undefined {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return undefined;
  }

  if ("items" in body === false) {
    return undefined;
  }

  const items = Reflect.get(body, "items");
  if (Array.isArray(items) === false) {
    return undefined;
  }

  const courses: ElovateCourseSummary[] = [];
  for (const item of items) {
    const course = parseCourseSummary(item);
    if (course !== undefined) {
      courses.push(course);
    }
  }
  return courses;
}

function readApiErrorMessage(body: unknown): string {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return "Could not create course.";
  }

  if ("message" in body) {
    const message = Reflect.get(body, "message");
    if (typeof message === "string" && message !== "") {
      return message;
    }
    if (Array.isArray(message)) {
      const parts: string[] = [];
      for (const item of message) {
        if (typeof item === "string" && item !== "") {
          parts.push(item);
        }
      }
      if (parts.length > 0) {
        return parts.join(" ");
      }
    }
  }

  return "Could not create course.";
}

export async function getCourse(
  courseId: string,
): Promise<ElovateCourseSummary | undefined> {
  const inFlight = courseInFlight.get(courseId);
  if (inFlight !== undefined) {
    return inFlight;
  }

  const request = (async () => {
    const response = await fetchElovateApi(`/courses/${courseId}`);
    if (response.status === 404) {
      return undefined;
    }
    if (response.ok === false) {
      const body: unknown = await response.json().catch(() => undefined);
      throw new ElovateApiError(response.status, readApiErrorMessage(body));
    }
    const body: unknown = await response.json();
    return parseCourseSummary(body);
  })().finally(() => {
    courseInFlight.delete(courseId);
  });

  courseInFlight.set(courseId, request);
  return request;
}

export async function createCourse(
  input: CreateCourseInput,
): Promise<ElovateCourseSummary> {
  const requestBody: Record<string, string> = {
    title: input.title,
    visibility: input.visibility,
  };
  if (input.description !== undefined && input.description !== "") {
    requestBody.description = input.description;
  }
  if (input.organizationId !== undefined) {
    requestBody.organizationId = input.organizationId;
  }

  const response = await fetchElovateApi("/courses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const responseBody = await response.json();
  if (response.ok === false) {
    throw new Error(readApiErrorMessage(responseBody));
  }

  const createdCourse = parseCourseSummary(responseBody);
  if (createdCourse === undefined) {
    throw new Error("Create course response was invalid.");
  }

  return createdCourse;
}
