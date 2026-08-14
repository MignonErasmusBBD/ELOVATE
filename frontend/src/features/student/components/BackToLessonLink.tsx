import Link from "next/link";
import { BookIcon } from "@/components/icons/BookIcon";

type BackToLessonLinkProps = {
  courseId: string;
  className?: string;
};

export function BackToLessonLink({
  courseId,
  className = "",
}: BackToLessonLinkProps) {
  return (
    <Link
      href={`/student/courses/${courseId}`}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:brightness-[0.97] ${className}`}
    >
      <BookIcon className="h-4 w-4" />
      Back to Lesson
    </Link>
  );
}
