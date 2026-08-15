import { StatusPill } from "@/components/ui/StatusPill";
import type { ElovateCourseStatus } from "@/helpers/coursesApi";

type EducatorCourseOption = {
  id: string;
  title: string;
  status: ElovateCourseStatus;
};

type EducatorCourseSelectProps = {
  courses: EducatorCourseOption[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
};

function statusPillForCourse(status: ElovateCourseStatus) {
  if (status === "active") {
    return { label: "Active", tone: "success" as const };
  }
  return { label: "Inactive", tone: "warning" as const };
}

export function EducatorCourseSelect({
  courses,
  selectedCourseId,
  onSelectCourse,
}: EducatorCourseSelectProps) {
  const selectedCourse = courses.find(
    (course) => course.id === selectedCourseId,
  );
  const selectedStatusPill =
    selectedCourse === undefined
      ? undefined
      : statusPillForCourse(selectedCourse.status);

  const activeCourses = courses.filter(
    (course) => course.status === "active",
  );
  const inactiveCourses = courses.filter(
    (course) => course.status === "deactivated",
  );

  return (
    <label className="block max-w-xl">
      <span className="text-sm font-semibold text-ink">Course</span>
      <span className="mt-2 flex items-center gap-3">
        <select
          value={selectedCourseId}
          onChange={(event) => onSelectCourse(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-border-ui bg-surface px-3 py-2.5 text-sm font-medium text-ink"
        >
          {activeCourses.length === 0 ? undefined : (
            <optgroup label="Active">
              {activeCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </optgroup>
          )}
          {inactiveCourses.length === 0 ? undefined : (
            <optgroup label="Inactive">
              {inactiveCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        {selectedStatusPill === undefined ? undefined : (
          <StatusPill
            label={selectedStatusPill.label}
            tone={selectedStatusPill.tone}
          />
        )}
      </span>
    </label>
  );
}
