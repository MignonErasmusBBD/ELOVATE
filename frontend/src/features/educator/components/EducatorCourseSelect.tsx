type EducatorCourseOption = {
  id: string;
  title: string;
};

type EducatorCourseSelectProps = {
  courses: EducatorCourseOption[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
};

export function EducatorCourseSelect({
  courses,
  selectedCourseId,
  onSelectCourse,
}: EducatorCourseSelectProps) {
  return (
    <label className="block max-w-md">
      <span className="text-sm font-semibold text-ink">Course</span>
      <select
        value={selectedCourseId}
        onChange={(event) => onSelectCourse(event.target.value)}
        className="mt-2 w-full rounded-lg border border-border-ui bg-surface px-3 py-2.5 text-sm font-medium text-ink"
      >
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.title}
          </option>
        ))}
      </select>
    </label>
  );
}
