export function safeNextPath(rawValue: string | undefined): string | undefined {
  if (rawValue === undefined || rawValue === "") {
    return undefined;
  }
  if (rawValue.startsWith("/") === false) {
    return undefined;
  }
  if (rawValue.startsWith("//")) {
    return undefined;
  }
  return rawValue;
}
