const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requiredMessage(fieldLabel: string) {
  return `${fieldLabel} is required.`;
}

export function validateEmail(emailAddress: string): string | undefined {
  if (!emailAddress.trim()) {
    return requiredMessage("Email address");
  }

  if (!EMAIL_PATTERN.test(emailAddress.trim())) {
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

export function validateRequiredName(
  nameValue: string,
  fieldLabel: string,
): string | undefined {
  if (!nameValue.trim()) {
    return requiredMessage(fieldLabel);
  }

  return undefined;
}
