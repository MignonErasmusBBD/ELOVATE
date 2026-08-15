import { notFound } from "next/navigation";
import { getCourseById } from "@/features/courses";
import { CourseWorkspaceNav } from "@/features/student/components/CourseWorkspaceNav";

export default async function StudentCourseWorkspaceLayout({
  children,
  params,
}: LayoutProps<"/student/courses/[courseId]">) {
  const { courseId } = await params;
  const course = getCourseById(courseId);

  if (course === undefined) {
    notFound();
  }

  return (
    <>
      <CourseWorkspaceNav courseId={course.id} courseTitle={course.title} />
      {children}
    </>
  );
}
