import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourseById } from "@/features/courses";
import { PracticeQuizPage } from "@/features/student";

export async function generateMetadata({
  params,
}: PageProps<"/student/courses/[courseId]/quiz">): Promise<Metadata> {
  const { courseId } = await params;
  const course = getCourseById(courseId);

  if (course === undefined) {
    return { title: "Practice Quiz" };
  }

  return {
    title: `Practice Quiz · ${course.title}`,
    description: `Practice quiz for ${course.title}.`,
  };
}

export default async function StudentCourseQuizPage({
  params,
}: PageProps<"/student/courses/[courseId]/quiz">) {
  const { courseId } = await params;
  const course = getCourseById(courseId);

  if (course === undefined) {
    notFound();
  }

  return <PracticeQuizPage course={course} />;
}
