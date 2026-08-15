import { fetchElovateApi } from "@/helpers/elovateApi";

export type ElovateCourseSummary = {
  id: string;
  title: string;
  visibility?: string;
  organizationId?: string;
};

export type CreateCourseInput = {
  title: string;
  description?: string;
  visibility: "private" | "community";
  organizationId?: string;
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

  return {
    id,
    title,
    visibility: readOptionalString(item, "visibility"),
    organizationId: readOptionalString(item, "organizationId"),
  };
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
