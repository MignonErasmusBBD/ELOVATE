export function selectedIfAvailable(
  selectedId: string,
  availableIds: string[],
): string {
  if (availableIds.includes(selectedId)) {
    return selectedId;
  }
  return "";
}
