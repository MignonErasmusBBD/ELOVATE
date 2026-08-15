import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { StudentDashboardPage } from "@/features/student";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Course Dashboard",
};

export default async function StudentCourseDashboardPage({
  params,
}: PageProps<"/student/courses/[courseId]/dashboard">) {
  const { courseId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session === null || session === undefined) {
    redirect("/login");
  }

  return (
    <StudentDashboardPage
      courseId={courseId}
      studentEmail={session.user.email}
    />
  );
}
