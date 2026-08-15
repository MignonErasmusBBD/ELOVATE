import { elovateApiJson } from "./elovateApi";

export async function recordContentView(
  courseId: string,
  sectionId: string,
  durationSeconds: number,
): Promise<void> {
  await elovateApiJson(`/courses/${courseId}/sections/${sectionId}/view`, {
    method: "POST",
    body: JSON.stringify({ durationSeconds }),
  });
}
