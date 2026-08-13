import type { Course } from "../types";
import { CourseIcon } from "./CourseIcon";

type CourseCardProps = {
  course: Course;
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border-ui bg-surface p-6 shadow-[0_8px_24px_rgba(30,27,51,0.06)] transition-shadow hover:shadow-[0_12px_32px_rgba(30,27,51,0.1)]">
      <figure className="m-0 flex h-11 w-11 items-center justify-center rounded-lg bg-coral text-white">
        <CourseIcon iconName={course.iconName} className="h-5 w-5" />
      </figure>
      <h2 className="mt-4 text-lg font-bold tracking-tight text-ink">
        {course.title}
      </h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
        {course.description}
      </p>
      <p className="mt-5 text-sm font-semibold text-coral">View Course →</p>
    </article>
  );
}
