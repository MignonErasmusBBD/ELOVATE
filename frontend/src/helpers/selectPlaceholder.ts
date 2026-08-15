export function selectPlaceholder(
  isLoading: boolean,
  hasOptions: boolean,
  loadingLabel: string,
  emptyLabel: string,
  readyLabel: string,
): string {
  if (isLoading) {
    return loadingLabel;
  }
  if (hasOptions === false) {
    return emptyLabel;
  }
  return readyLabel;
}
