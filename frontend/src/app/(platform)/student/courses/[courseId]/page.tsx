import type { Metadata } from "next";
import { LessonPage } from "@/features/student";

export const metadata: Metadata = {
  title: "Course Lesson",
};

export default async function StudentCourseLessonPage({
  params,
}: PageProps<"/student/courses/[courseId]">) {
  const { courseId } = await params;
  return <LessonPage courseId={courseId} />;
}
