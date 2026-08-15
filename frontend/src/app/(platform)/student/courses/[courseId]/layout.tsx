import { CourseWorkspaceHeader } from "@/features/student/components/CourseWorkspaceHeader";

export default async function StudentCourseWorkspaceLayout({
  children,
  params,
}: LayoutProps<"/student/courses/[courseId]">) {
  const { courseId } = await params;

  return (
    <>
      <CourseWorkspaceHeader courseId={courseId} />
      {children}
    </>
  );
}
