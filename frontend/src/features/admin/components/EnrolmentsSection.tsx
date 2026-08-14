"use client";

import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Label } from "@/components/ui/Label";
import {
  adminCourses,
  adminEnrolments,
  adminPeople,
  currentOrganisation,
} from "../data/placeholder";

const selectClassName =
  "w-full rounded-lg border border-border-ui bg-surface px-3 py-3 text-ink";

const organisationPeople = adminPeople.filter(
  (person) => person.organizationId === currentOrganisation.id,
);

const organisationPrivateCourses = adminCourses.filter(
  (course) =>
    course.owningOrganizationId === currentOrganisation.id &&
    course.visibility === "private",
);

const organisationEnrolments = adminEnrolments.filter((enrolment) => {
  const enrolledPerson = organisationPeople.find(
    (person) => person.id === enrolment.userId,
  );
  const enrolledCourse = organisationPrivateCourses.find(
    (course) => course.id === enrolment.courseId,
  );

  return enrolledPerson !== undefined && enrolledCourse !== undefined;
});

const firstPerson = organisationPeople[0];
const firstPrivateCourse = organisationPrivateCourses[0];

export function EnrolmentsSection() {
  const [selectedUserId, setSelectedUserId] = useState(
    firstPerson === undefined ? "" : firstPerson.id,
  );
  const [selectedCourseId, setSelectedCourseId] = useState(
    firstPrivateCourse === undefined ? "" : firstPrivateCourse.id,
  );

  function handleEnrolSubmit(submitEvent: SubmitEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
  }

  return (
    <section aria-labelledby="enrolments-heading" className="mt-8">
      <header className="mb-5">
        <h2 id="enrolments-heading" className="text-xl font-bold text-ink">
          Enrolments
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Private courses are only available to people you enrol. Deactivating a
          person or an enrolment removes their access; the course stays with{" "}
          {currentOrganisation.name}.
        </p>
      </header>

      <form
        className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={handleEnrolSubmit}
      >
        <FormField>
          <Label htmlFor="enrol-person">Person</Label>
          <select
            id="enrol-person"
            name="enrolPerson"
            className={selectClassName}
            value={selectedUserId}
            onChange={(changeEvent) =>
              setSelectedUserId(changeEvent.target.value)
            }
          >
            {organisationPeople.map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName}
              </option>
            ))}
          </select>
        </FormField>
        <FormField>
          <Label htmlFor="enrol-course">Private course</Label>
          <select
            id="enrol-course"
            name="enrolCourse"
            className={selectClassName}
            value={selectedCourseId}
            onChange={(changeEvent) =>
              setSelectedCourseId(changeEvent.target.value)
            }
          >
            {organisationPrivateCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </FormField>
        <Button variant="compact" type="submit">
          Enrol
        </Button>
      </form>

      <ul className="flex flex-col gap-4">
        {organisationEnrolments.map((enrolment) => (
          <li key={enrolment.id}>
            <article className="flex flex-col gap-3 rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)] sm:flex-row sm:items-center sm:justify-between">
              <header>
                <h3 className="text-base font-bold text-ink">
                  {enrolment.userFullName}
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  {enrolment.courseTitle}
                </p>
              </header>
              <button
                type="button"
                className="self-start text-sm font-semibold text-coral sm:self-center"
              >
                Deactivate
              </button>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
