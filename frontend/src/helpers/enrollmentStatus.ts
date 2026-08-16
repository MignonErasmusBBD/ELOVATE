export const REQUIRED_PRACTICE_ATTEMPTS_FOR_COMPLETION = 3;

export type EnrollmentStatus = "active" | "completed" | "withdrawn" | "overdue";

export function parseEnrollmentStatus(
  value: string | undefined,
): EnrollmentStatus | undefined {
  if (
    value === "active" ||
    value === "completed" ||
    value === "withdrawn" ||
    value === "overdue"
  ) {
    return value;
  }
  return undefined;
}

export function enrollmentStatusLabel(status: EnrollmentStatus): string {
  if (status === "withdrawn") {
    return "Withdrawn";
  }
  if (status === "completed") {
    return "Completed";
  }
  if (status === "overdue") {
    return "Overdue";
  }
  return "Active";
}

export function enrollmentStatusTone(
  status: EnrollmentStatus,
): "success" | "danger" | "muted" | "warning" {
  if (status === "active") {
    return "success";
  }
  if (status === "completed") {
    return "muted";
  }
  if (status === "overdue") {
    return "danger";
  }
  return "warning";
}
