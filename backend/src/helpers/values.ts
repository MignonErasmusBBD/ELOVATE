const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Values we bind to `$1`, `$2`, … in parameterized SQL. */
export type SqlParameter = string | number | boolean | undefined | null;

export type SqlQuery = <T extends object>(
  text: string,
  values?: SqlParameter[],
) => Promise<{ rows: T[] }>;

export function optionalText(value: string | undefined): string | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  return value;
}

export function isUuid(value: string): boolean {
  return uuidPattern.test(value);
}

/**
 * Postgres nullable text comes back as `null`. API fields use `undefined`.
 * Keep `null` only on row types that mirror the driver.
 */
export function textFromDatabase(value: string | null): string | undefined {
  if (value === null) {
    return undefined;
  }
  return value;
}

export function whereClause(conditions: string[]): string {
  if (conditions.length === 0) {
    return '';
  }
  return `WHERE ${conditions.join(' AND ')}`;
}

export function parseOptionalInteger(
  value: string | undefined,
): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  if (/^[0-9]+$/.test(value) === false) {
    return undefined;
  }
  return parseInt(value, 10);
}

export function dateFromDatabase(value: Date | null): Date | undefined {
  if (value === null) {
    return undefined;
  }
  return value;
}

export function booleanFromDatabase(
  value: boolean | null,
): boolean | undefined {
  if (value === null) {
    return undefined;
  }
  return value;
}
