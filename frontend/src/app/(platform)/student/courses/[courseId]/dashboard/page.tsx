import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourseById } from "@/features/courses";
import { getStudentDashboardSummary } from "@/features/student/data/dashboard";
import { StudentDashboardPage } from "@/features/student";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/student/courses/[courseId]/dashboard">): Promise<Metadata> {
  const { courseId } = await params;
  const course = getCourseById(courseId);

  if (course === undefined) {
    return { title: "Course dashboard" };
  }

  return {
    title: `Dashboard · ${course.title}`,
    description: `Practice-quiz dashboard for ${course.title}.`,
  };
}

export default async function StudentCourseDashboardPage({
  params,
}: PageProps<"/student/courses/[courseId]/dashboard">) {
  const { courseId } = await params;
  const course = getCourseById(courseId);

  if (course === undefined) {
    notFound();
  }

  const currentUser = await getCurrentUser();
  const dashboardSummary = getStudentDashboardSummary(
    course.id,
    course.title,
    currentUser.emailAddress,
  );

  return <StudentDashboardPage dashboardSummary={dashboardSummary} />;
}
