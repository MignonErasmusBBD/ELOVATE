const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requiredMessage(label: string) {
  return `${label} is required.`;
}

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return requiredMessage("Email address");
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    return "Enter a valid email address.";
  }
  return undefined;
}

export function validatePassword(
  password: string,
  label = "Password",
): string | undefined {
  if (!password) {
    return requiredMessage(label);
  }
  if (password.length < 8) {
    return `${label} must be at least 8 characters.`;
  }
  return undefined;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | undefined {
  if (!confirmPassword) {
    return "Confirm your password.";
  }
  if (confirmPassword !== password) {
    return "Passwords do not match.";
  }
  return undefined;
}

export function validateRequiredName(
  value: string,
  label: string,
): string | undefined {
  if (!value.trim()) {
    return requiredMessage(label);
  }
  return undefined;
}

export function hasErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean);
}
