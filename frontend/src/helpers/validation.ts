// RFC 5322 "Official Standard" pattern (emailregex.com) with case-insensitive domain.
const RFC5322_EMAIL_PATTERN =
  /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;

const RFC5322_MAX_EMAIL_LENGTH = 254;
const RFC5322_MAX_LOCAL_PART_LENGTH = 64;

function isRfc5322EmailAddress(emailAddress: string): boolean {
  if (emailAddress.length > RFC5322_MAX_EMAIL_LENGTH) {
    return false;
  }

  const atSeparatorIndex = emailAddress.indexOf("@");
  if (
    atSeparatorIndex === -1 ||
    atSeparatorIndex > RFC5322_MAX_LOCAL_PART_LENGTH
  ) {
    return false;
  }

  return RFC5322_EMAIL_PATTERN.test(emailAddress);
}

export function requiredMessage(fieldLabel: string) {
  return `${fieldLabel} is required.`;
}

export function validateEmail(emailAddress: string): string | undefined {
  const trimmedEmailAddress = emailAddress.trim();

  if (!trimmedEmailAddress) {
    return requiredMessage("Email address");
  }

  if (!isRfc5322EmailAddress(trimmedEmailAddress)) {
    return "Enter a valid email address.";
  }

  return undefined;
}

export function validatePassword(
  passwordValue: string,
  fieldLabel = "Password",
): string | undefined {
  if (!passwordValue) {
    return requiredMessage(fieldLabel);
  }

  if (passwordValue.length < 8) {
    return `${fieldLabel} must be at least 8 characters.`;
  }

  return undefined;
}

export function validateConfirmPassword(
  passwordValue: string,
  confirmPasswordValue: string,
): string | undefined {
  if (!confirmPasswordValue) {
    return "Confirm your password.";
  }

  if (confirmPasswordValue !== passwordValue) {
    return "Passwords do not match.";
  }

  return undefined;
}

export const COURSE_TITLE_MAX_LENGTH = 80;
export const COURSE_DESCRIPTION_MAX_LENGTH = 280;

export function validateRequiredName(
  nameValue: string,
  fieldLabel: string,
): string | undefined {
  if (!nameValue.trim()) {
    return requiredMessage(fieldLabel);
  }

  return undefined;
}

export function validateMaxLength(
  value: string,
  fieldLabel: string,
  maxLength: number,
): string | undefined {
  if (value.length > maxLength) {
    return `${fieldLabel} must be ${maxLength} characters or fewer.`;
  }

  return undefined;
}

export function validateCourseTitle(titleValue: string): string | undefined {
  const requiredError = validateRequiredName(titleValue, "Course title");
  if (requiredError !== undefined) {
    return requiredError;
  }

  return validateMaxLength(
    titleValue.trim(),
    "Course title",
    COURSE_TITLE_MAX_LENGTH,
  );
}

export function validateCourseDescription(
  descriptionValue: string,
): string | undefined {
  if (descriptionValue.trim() === "") {
    return undefined;
  }

  return validateMaxLength(
    descriptionValue.trim(),
    "Description",
    COURSE_DESCRIPTION_MAX_LENGTH,
  );
}

export function validateAtLeastOneSelected(
  selectedIds: string[],
  fieldLabel: string,
): string | undefined {
  if (selectedIds.length === 0) {
    return `Assign at least one ${fieldLabel}.`;
  }

  return undefined;
}
