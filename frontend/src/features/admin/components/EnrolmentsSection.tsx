"use client";

import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { ActionNotice } from "@/components/ui/ActionNotice";
import { ExplainTip } from "@/components/ui/ExplainTip";
import { useActionFeedback } from "@/features/platform";
import { errorMessageFromUnknown } from "@/helpers/elovateApi";
import { explainCopy } from "@/helpers/explainCopy";
import {
  dueAtToInputValue,
  dueDateLabel,
  dueUrgency,
  dueUrgencyClassName,
  isDueDateInPast,
  johannesburgTodayInputValue,
} from "@/helpers/johannesburgDate";
import { selectedIfAvailable } from "@/helpers/selectedIfAvailable";
import { selectPlaceholder } from "@/helpers/selectPlaceholder";
import {
  activateEnrolment,
  assignEnrolment,
  updateEnrolmentRequirement,
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
  AdminCourse,
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
  courses: AdminCourse[];
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

function RequirementCheckbox({
  id,
  checked,
  label,
  onChange,
}: Readonly<{
  id: string;
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}>) {
  return (
    <label
      htmlFor={id}
      className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        className="peer sr-only"
        onChange={(changeEvent) => onChange(changeEvent.target.checked)}
      />
      <span
        aria-hidden="true"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-surface peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"
      >
        <svg
          viewBox="0 0 16 16"
          className={checked ? "size-3.5 text-white" : "size-3.5 text-white opacity-0"}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
        >
          <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
        </svg>
      </span>
      {label}
    </label>
  );
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
  const { showSuccess } = useActionFeedback();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isRequiredAssignment, setIsRequiredAssignment] = useState(false);
  const [assignmentDueAt, setAssignmentDueAt] = useState("");
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
    if (isRequiredAssignment && assignmentDueAt === "") {
      setFormError("Required courses need a due date.");
      return;
    }
    if (isRequiredAssignment && isDueDateInPast(assignmentDueAt)) {
      setFormError("Due date cannot be in the past (Africa/Johannesburg).");
      return;
    }

    setFormError(undefined);
    setActionError(undefined);
    setIsSaving(true);
    try {
      const createdEnrolment = await assignEnrolment(
        enrolUserId,
        enrolCourseId,
        {
          isRequired: isRequiredAssignment,
          dueAt: isRequiredAssignment ? assignmentDueAt : undefined,
        },
      );
      if (createdEnrolment === undefined) {
        setFormError("Could not enrol that person.");
        return;
      }
      const remainingEnrolments = enrolments.filter(
        (enrolment) => enrolment.id !== createdEnrolment.id,
      );
      onEnrolmentsChange([createdEnrolment, ...remainingEnrolments]);
      setIsRequiredAssignment(false);
      setAssignmentDueAt("");
      showSuccess(
        `${createdEnrolment.userFullName} was enrolled in ${createdEnrolment.courseTitle}. They can open the lesson and practice quiz now.`,
      );
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
        showSuccess(
          `${enrolment.userFullName} was re-enrolled in ${enrolment.courseTitle}.`,
        );
      } else {
        await withdrawEnrolment(enrolment.id);
        showSuccess(
          `${enrolment.userFullName} was withdrawn from ${enrolment.courseTitle}. They lose lesson and quiz access until you activate the enrolment again.`,
        );
      }
    } catch (error) {
      setActionError(
        errorMessageFromUnknown(error, "Could not update enrolment status."),
      );
      await onDirectoryChanged();
    }
  }

  async function persistRequirement(
    enrolment: AdminEnrolment,
    requirement: { isRequired: boolean; dueAt: string | undefined },
  ) {
    setActionError(undefined);
    try {
      const updatedEnrolment = await updateEnrolmentRequirement(
        enrolment.id,
        requirement,
      );
      if (updatedEnrolment === undefined) {
        setActionError("Could not update required or due date.");
        await onDirectoryChanged();
        return;
      }
      onEnrolmentsChange(
        enrolments.map((candidate) => {
          if (candidate.id !== updatedEnrolment.id) {
            return candidate;
          }
          return updatedEnrolment;
        }),
      );
      showSuccess(
        `Enrolment details updated for ${updatedEnrolment.userFullName}.`,
      );
    } catch (error) {
      setActionError(
        errorMessageFromUnknown(
          error,
          "Could not update required or due date.",
        ),
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
        className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 md:items-end xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
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
        <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0 sm:flex-row sm:items-end">
          <legend className="sr-only">Required enrolment options</legend>
          <FormField className="sm:self-end sm:pb-2">
            <span className="inline-flex items-center gap-1.5">
              <RequirementCheckbox
                id="enrol-required"
                checked={isRequiredAssignment}
                label="Required"
                onChange={(nextRequired) => {
                  setIsRequiredAssignment(nextRequired);
                  if (nextRequired === false) {
                    setAssignmentDueAt("");
                  }
                }}
              />
              <ExplainTip label="About required enrolments">
                {explainCopy.enrolmentRequired}
              </ExplainTip>
            </span>
          </FormField>
          {isRequiredAssignment ? (
            <FormField className="min-w-0 flex-1">
              <Label
                htmlFor="enrol-due-at"
                className="inline-flex items-center gap-1.5"
              >
                Due date
                <ExplainTip label="About due dates">
                  {explainCopy.enrolmentDue}
                </ExplainTip>
              </Label>
              <Input
                id="enrol-due-at"
                name="enrolDueAt"
                type="date"
                value={assignmentDueAt}
                min={johannesburgTodayInputValue()}
                onChange={(changeEvent) =>
                  setAssignmentDueAt(changeEvent.target.value)
                }
              />
            </FormField>
          ) : undefined}
          <Button variant="compact" type="submit" isBusy={isSaving}>
            {isSaving ? "Enrolling…" : "Enrol"}
          </Button>
        </fieldset>
      </form>

      {formError === undefined ? undefined : (
        <FieldError id="enrol-form-error" message={formError} />
      )}

      {actionError === undefined ? undefined : (
        <ActionNotice
          tone="error"
          message={actionError}
          className="mb-4"
        />
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
          onSaveRequirement={persistRequirement}
        />
      ) : undefined}

      {groupView === "person" ? (
        <PersonEnrolmentGroups
          groups={personGroups}
          onChangeStatus={persistEnrolmentStatus}
          onSaveRequirement={persistRequirement}
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

type RequirementChange = {
  isRequired: boolean;
  dueAt: string | undefined;
};

function CourseEnrolmentGroups({
  groups,
  onChangeStatus,
  onSaveRequirement,
}: Readonly<{
  groups: CourseEnrolmentGroup[];
  onChangeStatus: (
    enrolment: AdminEnrolment,
    status: "active" | "withdrawn",
  ) => void;
  onSaveRequirement: (
    enrolment: AdminEnrolment,
    requirement: RequirementChange,
  ) => Promise<void>;
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
                    onSaveRequirement={onSaveRequirement}
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
  onSaveRequirement,
}: Readonly<{
  groups: PersonEnrolmentGroup[];
  onChangeStatus: (
    enrolment: AdminEnrolment,
    status: "active" | "withdrawn",
  ) => void;
  onSaveRequirement: (
    enrolment: AdminEnrolment,
    requirement: RequirementChange,
  ) => Promise<void>;
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
                    onSaveRequirement={onSaveRequirement}
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
  onSaveRequirement,
}: Readonly<{
  title: string;
  enrolment: AdminEnrolment;
  onChangeStatus: (
    enrolment: AdminEnrolment,
    status: "active" | "withdrawn",
  ) => void;
  onSaveRequirement: (
    enrolment: AdminEnrolment,
    requirement: RequirementChange,
  ) => Promise<void>;
}>) {
  const savedDueAt =
    enrolment.dueAt === undefined ? "" : dueAtToInputValue(enrolment.dueAt);
  const [isEditingRequirement, setIsEditingRequirement] = useState(false);
  const [isRequired, setIsRequired] = useState(enrolment.isRequired);
  const [dueAt, setDueAt] = useState(savedDueAt);
  const [isSavingRequirement, setIsSavingRequirement] = useState(false);
  const [requirementError, setRequirementError] = useState<
    string | undefined
  >();
  const urgency =
    enrolment.dueAt === undefined ? undefined : dueUrgency(enrolment.dueAt);
  const isDirty =
    isRequired !== enrolment.isRequired || dueAt !== savedDueAt;

  function openRequirementEditor() {
    setIsRequired(enrolment.isRequired);
    setDueAt(savedDueAt);
    setRequirementError(undefined);
    setIsEditingRequirement(true);
  }

  function closeRequirementEditor() {
    setIsRequired(enrolment.isRequired);
    setDueAt(savedDueAt);
    setRequirementError(undefined);
    setIsEditingRequirement(false);
  }

  async function handleSaveRequirement() {
    if (isRequired && dueAt === "") {
      setRequirementError("Required courses need a due date.");
      return;
    }
    if (isRequired && isDueDateInPast(dueAt)) {
      setRequirementError(
        "Due date cannot be in the past (Africa/Johannesburg).",
      );
      return;
    }
    setRequirementError(undefined);
    setIsSavingRequirement(true);
    try {
      await onSaveRequirement(enrolment, {
        isRequired,
        dueAt: isRequired ? dueAt : undefined,
      });
      setIsEditingRequirement(false);
    } finally {
      setIsSavingRequirement(false);
    }
  }

  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-xl border-2 border-border-ui bg-page p-3">
      <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="min-w-0 break-words text-sm font-semibold text-ink">
            {title}
          </span>
          <StatusPill
            label={enrolmentStatusLabel(enrolment.status)}
            tone={enrolmentStatusTone(enrolment.status)}
          />
        </p>
        <menu className="m-0 flex min-w-0 list-none flex-wrap items-center justify-end gap-2 p-0">
          {enrolment.isRequired ? (
            <span className="inline-flex items-center rounded-full border-2 border-red-500 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
              Required
            </span>
          ) : (
            <span className="text-xs font-medium text-text-secondary">
              Not required
            </span>
          )}
          {enrolment.dueAt === undefined || urgency === undefined ? undefined : (
            <span
              className={`inline-flex items-center rounded-full border-2 px-2 py-0.5 text-xs font-semibold ${dueUrgencyClassName(urgency)}`}
            >
              {dueDateLabel(enrolment.dueAt)}
            </span>
          )}
          <Button
            variant="outline"
            type="button"
            className="px-3 py-1.5 text-xs"
            aria-expanded={isEditingRequirement}
            onClick={() => {
              if (isEditingRequirement) {
                closeRequirementEditor();
                return;
              }
              openRequirementEditor();
            }}
          >
            {isEditingRequirement ? "Close" : "Edit"}
          </Button>
          <EnrolmentStatusButton
            enrolment={enrolment}
            onChangeStatus={onChangeStatus}
          />
        </menu>
      </header>
      {isEditingRequirement ? (
        <fieldset className="flex min-w-0 flex-col gap-3 border-t-2 border-border-ui pt-3 sm:flex-row sm:flex-wrap sm:items-end">
          <legend className="sr-only">Edit required and due date</legend>
          <RequirementCheckbox
            id={`enrolment-required-${enrolment.id}`}
            checked={isRequired}
            label="Required"
            onChange={(nextRequired) => {
              setIsRequired(nextRequired);
              if (nextRequired === false) {
                setDueAt("");
              }
            }}
          />
          {isRequired ? (
            <FormField className="min-w-0 sm:w-44">
              <Label htmlFor={`enrolment-due-${enrolment.id}`}>Due date</Label>
              <Input
                id={`enrolment-due-${enrolment.id}`}
                type="date"
                value={dueAt}
                min={johannesburgTodayInputValue()}
                onChange={(changeEvent) => setDueAt(changeEvent.target.value)}
              />
            </FormField>
          ) : undefined}
          <Button
            variant="compact"
            type="button"
            className="self-start px-3 py-1.5 text-xs sm:self-auto"
            isBusy={isSavingRequirement}
            disabled={isDirty === false}
            onClick={() => {
              void handleSaveRequirement();
            }}
          >
            {isSavingRequirement ? "Saving…" : "Save"}
          </Button>
          {requirementError === undefined ? undefined : (
            <FieldError
              id={`enrolment-requirement-error-${enrolment.id}`}
              message={requirementError}
            />
          )}
        </fieldset>
      ) : undefined}
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
