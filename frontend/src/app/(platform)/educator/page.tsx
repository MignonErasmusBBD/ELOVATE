import type { Metadata } from "next";
import { EducatorDashboardPage } from "@/features/educator";

export const metadata: Metadata = {
  title: "Educator dashboard",
  description:
    "Course-scoped educator view of students, practice performance, and questions.",
};

export default function EducatorRoutePage() {
  return <EducatorDashboardPage />;
}
