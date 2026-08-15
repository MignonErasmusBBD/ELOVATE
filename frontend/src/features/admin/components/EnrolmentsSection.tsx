"use client";

import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { errorMessageFromUnknown } from "@/helpers/elovateApi";
import { selectedIfAvailable } from "@/helpers/selectedIfAvailable";
import { selectPlaceholder } from "@/helpers/selectPlaceholder";
import {
  activateEnrolment,
  assignEnrolment,
  withdrawEnrolment,
} from "../orgAdminApi";
import {
  emptyStatusFilterMessage,
  itemsMatchingStatusAndSearch,
  type StatusFilter,
  type StatusFilterOption,
} from "../statusFilter";
import type {
  AdminEnrolment,
  AdminPerson,
  EnrolmentStatus,
  OrgPrivateCourse,
} from "../types";
import { StatusFilterNav } from "./StatusFilterNav";
import { StatusPill } from "./StatusPill";

const enrolmentStatusFilters: StatusFilterOption<
  StatusFilter<EnrolmentStatus>
>[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "withdrawn", label: "Withdrawn" },
  { id: "completed", label: "Completed" },
];

type EnrolmentGroupView = "course" | "person";

type EnrolmentsSectionProps = Readonly<{
  organizationName: string | undefined;
  people: AdminPerson[];
  courses: OrgPrivateCourse[];
  enrolments: AdminEnrolment[];
  isLoading: boolean;
  isLoadingPeople: boolean;
  isLoadingCourses: boolean;
  onEnrolmentsChange: (nextEnrolments: AdminEnrolment[]) => void;
  onDirectoryChanged: () => Promise<void>;
}>;

type PersonEnrolmentGroup = {
  userId: string;
  userFullName: string;
  enrolments: AdminEnrolment[];
};

type CourseEnrolmentGroup = {
  courseId: string;
  courseTitle: string;
  enrolments: AdminEnrolment[];
};

function enrolmentStatusLabel(status: EnrolmentStatus): string {
  if (status === "withdrawn") {
    return "Withdrawn";
  }
  if (status === "completed") {
    return "Completed";
  }
  return "Active";
}

function enrolmentStatusTone(
  status: EnrolmentStatus,
): "success" | "danger" | "muted" {
  if (status === "active") {
    return "success";
  }
  if (status === "withdrawn") {
    return "danger";
  }
  return "muted";
}

function groupEnrolmentsByPerson(
  enrolments: AdminEnrolment[],
): PersonEnrolmentGroup[] {
  const groups: PersonEnrolmentGroup[] = [];
  for (const enrolment of enrolments) {
    const existing = groups.find((group) => group.userId === enrolment.userId);
    if (existing === undefined) {
      groups.push({
        userId: enrolment.userId,
        userFullName: enrolment.userFullName,
        enrolments: [enrolment],
      });
      continue;
    }
    existing.enrolments.push(enrolment);
  }
  return groups.sort((left, right) =>
    left.userFullName.localeCompare(right.userFullName),
  );
}

function groupEnrolmentsByCourse(
  enrolments: AdminEnrolment[],
): CourseEnrolmentGroup[] {
  const groups: CourseEnrolmentGroup[] = [];
  for (const enrolment of enrolments) {
    const existing = groups.find(
      (group) => group.courseId === enrolment.courseId,
    );
    if (existing === undefined) {
      groups.push({
        courseId: enrolment.courseId,
        courseTitle: enrolment.courseTitle,
        enrolments: [enrolment],
      });
      continue;
    }
    existing.enrolments.push(enrolment);
  }
  return groups.sort((left, right) =>
    left.courseTitle.localeCompare(right.courseTitle),
  );
}

export function EnrolmentsSection({
  organizationName,
  people,
  courses,
  enrolments,
  isLoading,
  isLoadingPeople,
  isLoadingCourses,
  onEnrolmentsChange,
  onDirectoryChanged,
}: EnrolmentsSectionProps) {
  const organisationMembers = [...people]
    .filter((person) => person.status === "active")
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
  const activeCourses = courses.filter((course) => course.status === "active");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [groupView, setGroupView] = useState<EnrolmentGroupView>("course");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter<EnrolmentStatus>>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [formError, setFormError] = useState<string | undefined>();
  const [actionError, setActionError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const organisationName = organizationName ?? "your organisation";

  const enrolUserId = selectedIfAvailable(
    selectedUserId,
    organisationMembers.map((person) => person.id),
  );
  const enrolCourseId = selectedIfAvailable(
    selectedCourseId,
    activeCourses.map((course) => course.id),
  );

  const visibleEnrolments = itemsMatchingStatusAndSearch(
    enrolments,
    statusFilter,
    searchQuery,
    (enrolment) => enrolment.status,
    (enrolment) => [enrolment.userFullName, enrolment.courseTitle],
  );
  const personGroups = groupEnrolmentsByPerson(visibleEnrolments);
  const courseGroups = groupEnrolmentsByCourse(visibleEnrolments);

  async function handleEnrolSubmit(submitEvent: SubmitEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    if (enrolUserId === "" || enrolCourseId === "") {
      setFormError("Choose a person and a private course.");
      return;
    }

    setFormError(undefined);
    setActionError(undefined);
    setIsSaving(true);
    try {
      const createdEnrolment = await assignEnrolment(
        enrolUserId,
        enrolCourseId,
      );
      if (createdEnrolment === undefined) {
        setFormError("Could not enrol that person.");
        return;
      }
      const remainingEnrolments = enrolments.filter(
        (enrolment) => enrolment.id !== createdEnrolment.id,
      );
      onEnrolmentsChange([createdEnrolment, ...remainingEnrolments]);
    } catch (error) {
      setFormError(
        errorMessageFromUnknown(error, "Could not enrol that person."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function persistEnrolmentStatus(
    enrolment: AdminEnrolment,
    status: "active" | "withdrawn",
  ) {
    setActionError(undefined);
    onEnrolmentsChange(
      enrolments.map((candidate) => {
        if (candidate.id !== enrolment.id) {
          return candidate;
        }
        return {
          ...candidate,
          status,
        };
      }),
    );
    try {
      if (status === "active") {
        await activateEnrolment(enrolment.id);
      } else {
        await withdrawEnrolment(enrolment.id);
      }
    } catch (error) {
      setActionError(
        errorMessageFromUnknown(error, "Could not update enrolment status."),
      );
      await onDirectoryChanged();
    }
  }

  return (
    <section aria-labelledby="enrolments-heading" className="mt-8">
      <header className="mb-5">
        <h2 id="enrolments-heading" className="text-xl font-bold text-ink">
          Enrolments
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Assign people in {organisationName} to private courses. A person can
          be on more than one course. Withdrawing removes access; the course
          stays with the organisation.
        </p>
      </header>

      <form
        className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={handleEnrolSubmit}
      >
        <FormField>
          <Label htmlFor="enrol-person">Person</Label>
          <Select
            id="enrol-person"
            name="enrolPerson"
            value={enrolUserId}
            onChange={(changeEvent) =>
              setSelectedUserId(changeEvent.target.value)
            }
          >
            <option value="">
              {selectPlaceholder(
                isLoadingPeople,
                organisationMembers.length > 0,
                "Loading people…",
                "No people in the organisation",
                "Select a person",
              )}
            </option>
            {organisationMembers.map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField>
          <Label htmlFor="enrol-course">Private course</Label>
          <Select
            id="enrol-course"
            name="enrolCourse"
            value={enrolCourseId}
            onChange={(changeEvent) =>
              setSelectedCourseId(changeEvent.target.value)
            }
          >
            <option value="">
              {selectPlaceholder(
                isLoadingCourses,
                activeCourses.length > 0,
                "Loading courses…",
                "No private courses",
                "Select a course",
              )}
            </option>
            {activeCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </Select>
        </FormField>
        <Button variant="compact" type="submit" disabled={isSaving}>
          {isSaving ? "Enrolling…" : "Enrol"}
        </Button>
      </form>

      {formError === undefined ? undefined : (
        <FieldError id="enrol-form-error" message={formError} />
      )}

      {actionError === undefined ? undefined : (
        <p className="mb-4 text-sm text-coral" role="alert">
          {actionError}
        </p>
      )}

      {enrolments.length > 0 ? (
        <EnrolmentGroupNav
          selectedView={groupView}
          onSelectView={setGroupView}
        />
      ) : undefined}

      {enrolments.length > 0 ? (
        <StatusFilterNav
          ariaLabel="Enrolment status"
          filters={enrolmentStatusFilters}
          selectedFilter={statusFilter}
          onSelectFilter={setStatusFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          searchInputId="enrolments-search"
          searchLabel="Search enrolments"
          searchPlaceholder="Search enrolments"
        />
      ) : undefined}

      {isLoading && enrolments.length === 0 ? (
        <p className="text-sm text-text-secondary">Loading enrolments…</p>
      ) : undefined}

      {isLoading === false && enrolments.length === 0 ? (
        <p className="text-sm text-text-secondary">
          No enrolments yet. Enrol someone above.
        </p>
      ) : undefined}

      {enrolments.length > 0 && visibleEnrolments.length === 0 ? (
        <p className="text-sm text-text-secondary">
          {emptyStatusFilterMessage(statusFilter, searchQuery, "enrolments")}
        </p>
      ) : undefined}

      {groupView === "course" ? (
        <CourseEnrolmentGroups
          groups={courseGroups}
          onChangeStatus={persistEnrolmentStatus}
        />
      ) : undefined}

      {groupView === "person" ? (
        <PersonEnrolmentGroups
          groups={personGroups}
          onChangeStatus={persistEnrolmentStatus}
        />
      ) : undefined}
    </section>
  );
}

function EnrolmentGroupNav({
  selectedView,
  onSelectView,
}: Readonly<{
  selectedView: EnrolmentGroupView;
  onSelectView: (view: EnrolmentGroupView) => void;
}>) {
  return (
    <nav aria-label="Enrolment grouping" className="mb-4">
      <ul className="flex flex-wrap gap-2">
        <li>
          <button
            type="button"
            onClick={() => onSelectView("course")}
            aria-current={selectedView === "course" ? "true" : undefined}
            className={
              selectedView === "course"
                ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full border border-border-ui bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:bg-page"
            }
          >
            By course
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => onSelectView("person")}
            aria-current={selectedView === "person" ? "true" : undefined}
            className={
              selectedView === "person"
                ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full border border-border-ui bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:bg-page"
            }
          >
            By person
          </button>
        </li>
      </ul>
    </nav>
  );
}

function CourseEnrolmentGroups({
  groups,
  onChangeStatus,
}: Readonly<{
  groups: CourseEnrolmentGroup[];
  onChangeStatus: (
    enrolment: AdminEnrolment,
    status: "active" | "withdrawn",
  ) => void;
}>) {
  return (
    <ul className="flex flex-col gap-4">
      {groups.map((group) => (
        <li key={group.courseId}>
          <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
            <header className="mb-4">
              <h3 className="text-base font-bold text-ink">
                {group.courseTitle}
              </h3>
              <p className="mt-0.5 text-sm text-text-secondary">
                {group.enrolments.length === 1
                  ? "1 person"
                  : `${group.enrolments.length} people`}
              </p>
            </header>
            <ul className="flex flex-col gap-3">
              {[...group.enrolments]
                .sort((left, right) =>
                  left.userFullName.localeCompare(right.userFullName),
                )
                .map((enrolment) => (
                  <EnrolmentRow
                    key={enrolment.id}
                    title={enrolment.userFullName}
                    enrolment={enrolment}
                    onChangeStatus={onChangeStatus}
                  />
                ))}
            </ul>
          </article>
        </li>
      ))}
    </ul>
  );
}

function PersonEnrolmentGroups({
  groups,
  onChangeStatus,
}: Readonly<{
  groups: PersonEnrolmentGroup[];
  onChangeStatus: (
    enrolment: AdminEnrolment,
    status: "active" | "withdrawn",
  ) => void;
}>) {
  return (
    <ul className="flex flex-col gap-4">
      {groups.map((group) => (
        <li key={group.userId}>
          <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
            <header className="mb-4">
              <h3 className="text-base font-bold text-ink">
                {group.userFullName}
              </h3>
              <p className="mt-0.5 text-sm text-text-secondary">
                {group.enrolments.length === 1
                  ? "1 course"
                  : `${group.enrolments.length} courses`}
              </p>
            </header>
            <ul className="flex flex-col gap-3">
              {[...group.enrolments]
                .sort((left, right) =>
                  left.courseTitle.localeCompare(right.courseTitle),
                )
                .map((enrolment) => (
                  <EnrolmentRow
                    key={enrolment.id}
                    title={enrolment.courseTitle}
                    enrolment={enrolment}
                    onChangeStatus={onChangeStatus}
                  />
                ))}
            </ul>
          </article>
        </li>
      ))}
    </ul>
  );
}

function EnrolmentRow({
  title,
  enrolment,
  onChangeStatus,
}: Readonly<{
  title: string;
  enrolment: AdminEnrolment;
  onChangeStatus: (
    enrolment: AdminEnrolment,
    status: "active" | "withdrawn",
  ) => void;
}>) {
  return (
    <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <StatusPill
          label={enrolmentStatusLabel(enrolment.status)}
          tone={enrolmentStatusTone(enrolment.status)}
        />
      </div>
      <EnrolmentStatusButton
        enrolment={enrolment}
        onChangeStatus={onChangeStatus}
      />
    </li>
  );
}

function EnrolmentStatusButton({
  enrolment,
  onChangeStatus,
}: Readonly<{
  enrolment: AdminEnrolment;
  onChangeStatus: (
    enrolment: AdminEnrolment,
    status: "active" | "withdrawn",
  ) => void;
}>) {
  if (enrolment.status === "active") {
    return (
      <Button
        variant="outline"
        type="button"
        className="self-start sm:self-center"
        onClick={() => onChangeStatus(enrolment, "withdrawn")}
      >
        Withdraw
      </Button>
    );
  }
  if (enrolment.status === "withdrawn") {
    return (
      <Button
        variant="compact"
        type="button"
        className="self-start sm:self-center"
        onClick={() => onChangeStatus(enrolment, "active")}
      >
        Activate
      </Button>
    );
  }
  return undefined;
}
