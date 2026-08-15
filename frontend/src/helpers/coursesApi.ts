import { fetchElovateApi } from "@/helpers/elovateApi";

export type ElovateCourseStatus = "active" | "deactivated";

export type ElovateCourseSummary = {
  id: string;
  title: string;
  status?: ElovateCourseStatus;
  description?: string;
  visibility?: string;
  organizationId?: string;
};

export type CreateCourseInput = {
  title: string;
  description?: string;
  visibility: "private" | "community";
  organizationId?: string;
};

export type ListCoursesInput = {
  visibility?: "private" | "community";
  organizationId?: string;
  status?: ElovateCourseStatus;
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
  const status =
    statusValue === "active" || statusValue === "deactivated"
      ? statusValue
      : undefined;

  return {
    id,
    title,
    description: readOptionalString(item, "description"),
    visibility: readOptionalString(item, "visibility"),
    organizationId: readOptionalString(item, "organizationId"),
    status: readOptionalString(item, "status"),
  };
}

export async function listCourses(
  input: ListCoursesInput,
): Promise<ElovateCourseSummary[]> {
  const queryParams = new URLSearchParams();
  if (input.visibility !== undefined) {
    queryParams.set("visibility", input.visibility);
  }
  if (input.organizationId !== undefined) {
    queryParams.set("organizationId", input.organizationId);
  }
  if (input.status !== undefined) {
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

export async function listCourses(
  input: ListCoursesInput,
): Promise<ElovateCourseSummary[]> {
  const queryParams = new URLSearchParams();
  if (input.visibility !== undefined) {
    queryParams.set("visibility", input.visibility);
  }
  if (input.organizationId !== undefined) {
    queryParams.set("organizationId", input.organizationId);
  }
  if (input.status !== undefined) {
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

export async function listCourses(params?: {
  visibility?: string;
  organizationId?: string;
  status?: string;
}): Promise<ElovateCourseSummary[]> {
  const query = new URLSearchParams();
  if (params?.visibility !== undefined) {
    query.set("visibility", params.visibility);
  }
  if (params?.organizationId !== undefined) {
    query.set("organizationId", params.organizationId);
  }
  if (params?.status !== undefined) {
    query.set("status", params.status);
  }
  const qs = query.toString();
  const response = await fetchElovateApi(`/courses${qs !== "" ? `?${qs}` : ""}`);
  if (response.ok === false) {
    throw new Error("Could not load courses.");
  }
  const body = await response.json();
  return parseCourseListResponse(body) ?? [];
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
