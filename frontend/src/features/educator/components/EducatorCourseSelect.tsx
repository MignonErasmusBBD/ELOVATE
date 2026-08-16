"use client";

import { useState } from "react";
import { SearchField } from "@/components/ui/SearchField";
import { StatusPill } from "@/components/ui/StatusPill";
import type { ElovateCourseStatus } from "@/helpers/coursesApi";
import { itemsMatchingSearch } from "@/helpers/search";

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

function statusPillForCourse(status: ElovateCourseStatus): {
  label: string;
  tone: "success" | "warning";
} {
  if (status === "active") {
    return { label: "Active", tone: "success" };
  }
  if (status === "draft") {
    return { label: "Draft", tone: "warning" };
  }
  return { label: "Inactive", tone: "warning" };
}

export function EducatorCourseSelect({
  courses,
  selectedCourseId,
  onSelectCourse,
}: EducatorCourseSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const selectedCourse = courses.find(
    (course) => course.id === selectedCourseId,
  );
  const matchingCourses = itemsMatchingSearch(courses, searchQuery, (course) => [
    course.title,
  ]);
  const visibleCourses =
    selectedCourse === undefined ||
    matchingCourses.some((course) => course.id === selectedCourseId)
      ? matchingCourses
      : [selectedCourse, ...matchingCourses];
  const selectedStatusPill =
    selectedCourse === undefined
      ? undefined
      : statusPillForCourse(selectedCourse.status);

  const activeCourses = visibleCourses.filter(
    (course) => course.status === "active",
  );
  const draftCourses = visibleCourses.filter((course) => course.status === "draft");
  const inactiveCourses = visibleCourses.filter(
    (course) => course.status === "deactivated",
  );

  return (
    <section className="flex min-w-0 max-w-xl flex-col gap-3">
      <SearchField
        id="educator-course-search"
        label="Search courses"
        placeholder="Search courses"
        value={searchQuery}
        onChange={setSearchQuery}
        className="w-full"
      />
    <label className="block min-w-0">
      <span className="text-sm font-semibold text-ink">Course</span>
      <span className="mt-2 flex min-w-0 items-center gap-3">
        <select
          value={selectedCourseId}
          onChange={(event) => onSelectCourse(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-border-ui bg-surface px-3 py-2.5 text-sm font-medium text-ink"
        >
          {draftCourses.length === 0 ? undefined : (
            <optgroup label="Draft">
              {draftCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </optgroup>
          )}
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
    </section>
  );
}
