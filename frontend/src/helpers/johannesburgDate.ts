export const JOHANNESBURG_TIME_ZONE = "Africa/Johannesburg";

export type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

export type DueUrgency = "week" | "fortnight" | "month" | "later";

function calendarDateFromParts(
  parts: Intl.DateTimeFormatPart[],
): CalendarDate | undefined {
  let year: number | undefined;
  let month: number | undefined;
  let day: number | undefined;
  for (const part of parts) {
    if (part.type === "year") {
      year = Number.parseInt(part.value, 10);
    }
    if (part.type === "month") {
      month = Number.parseInt(part.value, 10);
    }
    if (part.type === "day") {
      day = Number.parseInt(part.value, 10);
    }
  }
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    return undefined;
  }
  return { year, month, day };
}

export function johannesburgToday(): CalendarDate | undefined {
  const parts = new Intl.DateTimeFormat("en-ZA", {
    timeZone: JOHANNESBURG_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return calendarDateFromParts(parts);
}

export function parseIsoCalendarDate(
  value: string,
): CalendarDate | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match === null) {
    return undefined;
  }
  const year = Number.parseInt(match[1] ?? "", 10);
  const month = Number.parseInt(match[2] ?? "", 10);
  const day = Number.parseInt(match[3] ?? "", 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return undefined;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined;
  }
  return { year, month, day };
}

function twoDigits(value: number): string {
  if (value < 10) {
    return `0${value}`;
  }
  return `${value}`;
}

export function johannesburgTodayInputValue(): string {
  const today = johannesburgToday();
  if (today === undefined) {
    return "";
  }
  return `${today.year}-${twoDigits(today.month)}-${twoDigits(today.day)}`;
}

export function isDueDateInPast(value: string): boolean {
  const parsed = parseIsoCalendarDate(value.slice(0, 10));
  const today = johannesburgToday();
  if (parsed === undefined || today === undefined) {
    return true;
  }
  if (parsed.year !== today.year) {
    return parsed.year < today.year;
  }
  if (parsed.month !== today.month) {
    return parsed.month < today.month;
  }
  return parsed.day < today.day;
}

function johannesburgCalendarFromInstant(
  instant: Date,
): CalendarDate | undefined {
  if (Number.isNaN(instant.getTime())) {
    return undefined;
  }
  const parts = new Intl.DateTimeFormat("en-ZA", {
    timeZone: JOHANNESBURG_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  return calendarDateFromParts(parts);
}

export function daysUntilDue(dueAtIso: string): number | undefined {
  const due = johannesburgCalendarFromInstant(new Date(dueAtIso));
  const today = johannesburgToday();
  if (due === undefined || today === undefined) {
    return undefined;
  }
  const fromUtc = Date.UTC(today.year, today.month - 1, today.day);
  const toUtc = Date.UTC(due.year, due.month - 1, due.day);
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

export function dueUrgency(dueAtIso: string): DueUrgency | undefined {
  const days = daysUntilDue(dueAtIso);
  if (days === undefined) {
    return undefined;
  }
  if (days <= 7) {
    return "week";
  }
  if (days <= 14) {
    return "fortnight";
  }
  if (days <= 30) {
    return "month";
  }
  return "later";
}

export function dueAtToInputValue(dueAtIso: string): string {
  const due = johannesburgCalendarFromInstant(new Date(dueAtIso));
  if (due === undefined) {
    return dueAtIso.slice(0, 10);
  }
  return `${due.year}-${twoDigits(due.month)}-${twoDigits(due.day)}`;
}

export function dueDateLabel(dueAtIso: string): string {
  const days = daysUntilDue(dueAtIso);
  const formatted = formatDueDateJohannesburg(dueAtIso);
  if (days !== undefined && days < 0) {
    return `Overdue ${formatted}`;
  }
  return `Due ${formatted}`;
}

export function formatDueDateJohannesburg(dueAtIso: string): string {
  const parsed = new Date(dueAtIso);
  if (Number.isNaN(parsed.getTime())) {
    return dueAtIso;
  }
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: JOHANNESBURG_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function dueUrgencyClassName(urgency: DueUrgency): string {
  if (urgency === "week") {
    return "border-red-500 bg-red-50 text-red-700";
  }
  if (urgency === "fortnight") {
    return "border-orange-500 bg-orange-50 text-orange-700";
  }
  if (urgency === "month") {
    return "border-sky-500 bg-sky-50 text-sky-700";
  }
  return "border-emerald-500 bg-emerald-50 text-emerald-700";
}

export function courseCardUrgencyClassName(urgency: DueUrgency): string {
  if (urgency === "week") {
    return "border-red-500";
  }
  if (urgency === "fortnight") {
    return "border-orange-500";
  }
  if (urgency === "month") {
    return "border-sky-500";
  }
  return "border-emerald-500";
}
