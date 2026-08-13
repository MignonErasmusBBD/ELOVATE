import { courses } from "../data/courses";
import { CourseCard } from "./CourseCard";

export function CoursesPage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
          All Courses
        </h1>
        <p className="mt-2 max-w-2xl text-base text-text-secondary">
          Browse our catalog of courses. Click on a course to explore its
          learning units.
        </p>
      </header>

      <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <li key={course.id}>
            <CourseCard course={course} />
          </li>
        ))}
      </ul>
    </section>
  );
}
