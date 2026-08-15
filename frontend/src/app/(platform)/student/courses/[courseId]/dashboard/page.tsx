import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getCourseById } from "@/features/courses";
import { getStudentDashboardSummary } from "@/features/student/data/dashboard";
import { StudentDashboardPage } from "@/features/student";
import { auth } from "@/lib/auth";

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

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session === null || session === undefined) {
    redirect("/login");
  }

  const dashboardSummary = getStudentDashboardSummary(
    course.id,
    course.title,
    session.user.email,
  );

  return <StudentDashboardPage dashboardSummary={dashboardSummary} />;
}
