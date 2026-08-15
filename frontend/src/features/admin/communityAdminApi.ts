import { elovateApiJson } from "@/helpers/elovateApi";
import { parseAdminCourse, parseAdminCourses } from "./parseDirectory";
import type { AdminCourse } from "./types";

export async function listCommunityCourses(): Promise<AdminCourse[]> {
  const query = new URLSearchParams({
    visibility: "community",
    status: "all",
  });
  const body = await elovateApiJson(`/courses?${query.toString()}`);
  return parseAdminCourses(body);
}

export async function createCommunityCourse(
  title: string,
  description: string | undefined,
): Promise<AdminCourse | undefined> {
  const requestBody: {
    title: string;
    visibility: "community";
    description?: string;
  } = {
    title,
    visibility: "community",
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
