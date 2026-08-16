import { CourseWorkspaceShell } from "@/features/student/components/CourseWorkspaceShell";

export default async function StudentCourseWorkspaceLayout({
  children,
  params,
}: LayoutProps<"/student/courses/[courseId]">) {
  const { courseId } = await params;

  return (
    <CourseWorkspaceShell courseId={courseId}>{children}</CourseWorkspaceShell>
  );
}
