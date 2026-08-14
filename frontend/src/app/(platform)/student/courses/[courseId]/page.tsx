import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourseById } from "@/features/courses";
import { LessonPage } from "@/features/student";

export async function generateMetadata({
  params,
}: PageProps<"/student/courses/[courseId]">): Promise<Metadata> {
  const { courseId } = await params;
  const course = getCourseById(courseId);

  if (course === undefined) {
    return { title: "Course" };
  }

  return {
    title: course.title,
    description: course.description,
  };
}

export default async function StudentCourseLessonPage({
  params,
}: PageProps<"/student/courses/[courseId]">) {
  const { courseId } = await params;
  const course = getCourseById(courseId);

  if (course === undefined) {
    notFound();
  }

  return <LessonPage course={course} />;
}
