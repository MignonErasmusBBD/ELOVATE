export type FieldErrorMap = Record<string, string | undefined>;

export function hasFieldErrors(fieldErrors: FieldErrorMap): boolean {
  return Object.values(fieldErrors).some(
    (errorMessage) => errorMessage !== undefined,
  );
}

export function clearFieldError<TFieldErrors extends FieldErrorMap>(
  fieldErrors: TFieldErrors,
  fieldName: keyof TFieldErrors,
): TFieldErrors {
  if (fieldErrors[fieldName] === undefined) {
    return fieldErrors;
  }

  const updatedFieldErrors = { ...fieldErrors };
  delete updatedFieldErrors[fieldName];
  return updatedFieldErrors;
}

export function focusFirstInvalidField<TFieldName extends string>(
  formElement: HTMLFormElement,
  fieldErrors: Partial<Record<TFieldName, string | undefined>>,
  fieldOrder: readonly TFieldName[],
  fieldElementIds: Partial<Record<TFieldName, string>> = {},
): void {
  const firstInvalidField = fieldOrder.find(
    (fieldName) => fieldErrors[fieldName] !== undefined,
  );

  if (firstInvalidField === undefined) {
    return;
  }

  const fieldElementId =
    fieldElementIds[firstInvalidField] ?? firstInvalidField;
  formElement.querySelector<HTMLElement>(`#${fieldElementId}`)?.focus();
}
