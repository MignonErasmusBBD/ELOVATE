import type { Metadata } from "next";
import { CoursesPage } from "@/features/courses";

export const metadata: Metadata = {
  title: "All Courses",
  description:
    "Browse our catalog of courses. Click on a course to explore its learning units.",
};

export default function CoursesRoutePage() {
  return <CoursesPage />;
}
