import type { Metadata } from "next";
import { PracticeQuizPage } from "@/features/student";

export const metadata: Metadata = {
  title: "Practice Quiz",
};

export default async function StudentCourseQuizPage({
  params,
}: PageProps<"/student/courses/[courseId]/quiz">) {
  const { courseId } = await params;
  return <PracticeQuizPage courseId={courseId} />;
}
