export const JOHANNESBURG_TIME_ZONE = 'Africa/Johannesburg';

export type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

function calendarDateFromParts(
  parts: Intl.DateTimeFormatPart[],
): CalendarDate | undefined {
  let year: number | undefined;
  let month: number | undefined;
  let day: number | undefined;
  for (const part of parts) {
    if (part.type === 'year') {
      year = Number.parseInt(part.value, 10);
    }
    if (part.type === 'month') {
      month = Number.parseInt(part.value, 10);
    }
    if (part.type === 'day') {
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
  const parts = new Intl.DateTimeFormat('en-ZA', {
    timeZone: JOHANNESBURG_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
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
  const year = Number.parseInt(match[1] ?? '', 10);
  const month = Number.parseInt(match[2] ?? '', 10);
  const day = Number.parseInt(match[3] ?? '', 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return undefined;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined;
  }
  return { year, month, day };
}

export function compareCalendarDates(
  left: CalendarDate,
  right: CalendarDate,
): number {
  if (left.year !== right.year) {
    return left.year - right.year;
  }
  if (left.month !== right.month) {
    return left.month - right.month;
  }
  return left.day - right.day;
}

export function isCalendarDateBeforeToday(value: string): boolean {
  const parsed = parseIsoCalendarDate(value.slice(0, 10));
  const today = johannesburgToday();
  if (parsed === undefined || today === undefined) {
    return true;
  }
  return compareCalendarDates(parsed, today) < 0;
}

function twoDigits(value: number): string {
  if (value < 10) {
    return `0${value}`;
  }
  return `${value}`;
}

/** End of that calendar day in SAST (UTC+2, no DST). */
export function johannesburgEndOfDay(value: string): Date | undefined {
  const parsed = parseIsoCalendarDate(value.slice(0, 10));
  if (parsed === undefined) {
    return undefined;
  }
  return new Date(
    `${parsed.year}-${twoDigits(parsed.month)}-${twoDigits(parsed.day)}T23:59:59.999+02:00`,
  );
}
