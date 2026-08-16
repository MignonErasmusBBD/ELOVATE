export function isPlainObject(value: unknown): value is object {
  return value instanceof Object && Array.isArray(value) === false;
}

export function readRequiredString(
  body: object,
  key: string,
): string | undefined {
  if (key in body === false) {
    return undefined;
  }
  const field = Reflect.get(body, key);
  if (typeof field !== "string" || field === "") {
    return undefined;
  }
  return field;
}

export function readOptionalString(
  body: object,
  key: string,
): string | undefined {
  return readRequiredString(body, key);
}

export function readOptionalBoolean(
  body: object,
  key: string,
): boolean | undefined {
  if (key in body === false) {
    return undefined;
  }
  const field = Reflect.get(body, key);
  if (typeof field !== "boolean") {
    return undefined;
  }
  return field;
}

export function readOptionalNumber(
  body: object,
  key: string,
): number | undefined {
  if (key in body === false) {
    return undefined;
  }
  const field = Reflect.get(body, key);
  if (typeof field !== "number" || Number.isFinite(field) === false) {
    return undefined;
  }
  return field;
}

export function readStringList(body: object, key: string): string[] {
  if (key in body === false) {
    return [];
  }
  const field = Reflect.get(body, key);
  if (Array.isArray(field) === false) {
    return [];
  }
  const values: string[] = [];
  for (const item of field) {
    if (typeof item === "string" && item !== "") {
      values.push(item);
    }
  }
  return values;
}

export function readObjectList(body: object, key: string): object[] {
  if (key in body === false) {
    return [];
  }
  const field = Reflect.get(body, key);
  if (Array.isArray(field) === false) {
    return [];
  }
  const items: object[] = [];
  for (const item of field) {
    if (isPlainObject(item)) {
      items.push(item);
    }
  }
  return items;
}

export function readErrorMessage(body: unknown, fallback: string): string {
  if (isPlainObject(body) === false) {
    return fallback;
  }
  if ("message" in body === false) {
    return fallback;
  }
  const message = Reflect.get(body, "message");
  if (typeof message === "string" && message !== "") {
    return message;
  }
  if (Array.isArray(message) === false) {
    return fallback;
  }
  const firstMessage = message[0];
  if (typeof firstMessage === "string" && firstMessage !== "") {
    return firstMessage;
  }
  return fallback;
}
