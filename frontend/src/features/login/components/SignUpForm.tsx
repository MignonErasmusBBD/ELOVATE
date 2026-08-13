"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { LockIcon } from "@/components/icons/LockIcon";
import { MailIcon } from "@/components/icons/MailIcon";
import {
  clearFieldError,
  focusFirstInvalidField,
  hasFieldErrors,
} from "@/helpers/formErrors";
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateRequiredName,
} from "@/helpers/validation";

type SignUpFieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const SIGN_UP_FIELD_ORDER = [
  "firstName",
  "lastName",
  "email",
  "password",
  "confirmPassword",
] as const;

const SIGN_UP_FIELD_ELEMENT_IDS: Record<
  (typeof SIGN_UP_FIELD_ORDER)[number],
  string
> = {
  firstName: "firstName",
  lastName: "lastName",
  email: "signup-email",
  password: "signup-password",
  confirmPassword: "confirmPassword",
};

export function SignUpForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  function buildFieldErrors(): SignUpFieldErrors {
    return {
      firstName: validateRequiredName(firstName, "First name"),
      lastName: validateRequiredName(lastName, "Last name"),
      email: validateEmail(emailAddress),
      password: validatePassword(passwordValue),
      confirmPassword: validateConfirmPassword(
        passwordValue,
        confirmPasswordValue,
      ),
    };
  }

  function handleSubmit(submitEvent: SubmitEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setHasAttemptedSubmit(true);

    const nextFieldErrors = buildFieldErrors();
    setFieldErrors(nextFieldErrors);

    if (hasFieldErrors(nextFieldErrors)) {
      focusFirstInvalidField(
        submitEvent.currentTarget,
        nextFieldErrors,
        SIGN_UP_FIELD_ORDER,
        SIGN_UP_FIELD_ELEMENT_IDS,
      );
      return;
    }

    router.push("/courses");
  }

  return (
    <section className="flex w-full max-w-md flex-col">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
          Create Account
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          Join ELOVATE and start your customized learning journey.
        </p>
      </header>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <FormField>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="Design"
            value={firstName}
            invalid={fieldErrors.firstName !== undefined}
            onChange={(changeEvent) => {
              setFirstName(changeEvent.target.value);
              setFieldErrors((currentFieldErrors) =>
                clearFieldError(currentFieldErrors, "firstName"),
              );
            }}
            onBlur={() => {
              if (!hasAttemptedSubmit && !firstName) {
                return;
              }

              setFieldErrors((currentFieldErrors) => ({
                ...currentFieldErrors,
                firstName: validateRequiredName(firstName, "First name"),
              }));
            }}
            aria-describedby={
              fieldErrors.firstName !== undefined
                ? "firstName-error"
                : undefined
            }
          />
          {fieldErrors.firstName !== undefined ? (
            <FieldError id="firstName-error" message={fieldErrors.firstName} />
          ) : undefined}
        </FormField>

        <FormField>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Withdesigners"
            value={lastName}
            invalid={fieldErrors.lastName !== undefined}
            onChange={(changeEvent) => {
              setLastName(changeEvent.target.value);
              setFieldErrors((currentFieldErrors) =>
                clearFieldError(currentFieldErrors, "lastName"),
              );
            }}
            onBlur={() => {
              if (!hasAttemptedSubmit && !lastName) {
                return;
              }

              setFieldErrors((currentFieldErrors) => ({
                ...currentFieldErrors,
                lastName: validateRequiredName(lastName, "Last name"),
              }));
            }}
            aria-describedby={
              fieldErrors.lastName !== undefined ? "lastName-error" : undefined
            }
          />
          {fieldErrors.lastName !== undefined ? (
            <FieldError id="lastName-error" message={fieldErrors.lastName} />
          ) : undefined}
        </FormField>

        <FormField>
          <Label htmlFor="signup-email">Email Address</Label>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="designwithdesigners@gmail.com"
            value={emailAddress}
            invalid={fieldErrors.email !== undefined}
            onChange={(changeEvent) => {
              setEmailAddress(changeEvent.target.value);
              setFieldErrors((currentFieldErrors) =>
                clearFieldError(currentFieldErrors, "email"),
              );
            }}
            onBlur={() => {
              if (!hasAttemptedSubmit && !emailAddress) {
                return;
              }

              setFieldErrors((currentFieldErrors) => ({
                ...currentFieldErrors,
                email: validateEmail(emailAddress),
              }));
            }}
            aria-describedby={
              fieldErrors.email !== undefined ? "signup-email-error" : undefined
            }
            startIcon={<MailIcon className="h-5 w-5" />}
          />
          {fieldErrors.email !== undefined ? (
            <FieldError id="signup-email-error" message={fieldErrors.email} />
          ) : undefined}
        </FormField>

        <FormField>
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="new-password"
            value={passwordValue}
            invalid={fieldErrors.password !== undefined}
            onChange={(changeEvent) => {
              const nextPasswordValue = changeEvent.target.value;
              setPasswordValue(nextPasswordValue);
              setFieldErrors((currentFieldErrors) => {
                const updatedFieldErrors = clearFieldError(
                  currentFieldErrors,
                  "password",
                );

                if (
                  currentFieldErrors.confirmPassword !== undefined &&
                  confirmPasswordValue
                ) {
                  return {
                    ...updatedFieldErrors,
                    confirmPassword: validateConfirmPassword(
                      nextPasswordValue,
                      confirmPasswordValue,
                    ),
                  };
                }

                return updatedFieldErrors;
              });
            }}
            onBlur={() => {
              if (!hasAttemptedSubmit && !passwordValue) {
                return;
              }

              setFieldErrors((currentFieldErrors) => ({
                ...currentFieldErrors,
                password: validatePassword(passwordValue),
              }));
            }}
            aria-describedby={
              fieldErrors.password !== undefined
                ? "signup-password-error"
                : undefined
            }
            startIcon={<LockIcon className="h-5 w-5" />}
            endAdornment={
              <Button
                variant="ghost"
                type="button"
                className="text-xs"
                onClick={() =>
                  setIsPasswordVisible((currentlyVisible) => !currentlyVisible)
                }
                aria-pressed={isPasswordVisible}
                aria-label={
                  isPasswordVisible ? "Hide password" : "Show password"
                }
              >
                {isPasswordVisible ? "Hide" : "Show"}
              </Button>
            }
          />
          {fieldErrors.password !== undefined ? (
            <FieldError
              id="signup-password-error"
              message={fieldErrors.password}
            />
          ) : undefined}
        </FormField>

        <FormField>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={isConfirmPasswordVisible ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPasswordValue}
            invalid={fieldErrors.confirmPassword !== undefined}
            onChange={(changeEvent) => {
              setConfirmPasswordValue(changeEvent.target.value);
              setFieldErrors((currentFieldErrors) =>
                clearFieldError(currentFieldErrors, "confirmPassword"),
              );
            }}
            onBlur={() => {
              if (!hasAttemptedSubmit && !confirmPasswordValue) {
                return;
              }

              setFieldErrors((currentFieldErrors) => ({
                ...currentFieldErrors,
                confirmPassword: validateConfirmPassword(
                  passwordValue,
                  confirmPasswordValue,
                ),
              }));
            }}
            aria-describedby={
              fieldErrors.confirmPassword !== undefined
                ? "confirmPassword-error"
                : undefined
            }
            startIcon={<LockIcon className="h-5 w-5" />}
            endAdornment={
              <Button
                variant="ghost"
                type="button"
                className="text-xs"
                onClick={() =>
                  setIsConfirmPasswordVisible(
                    (currentlyVisible) => !currentlyVisible,
                  )
                }
                aria-pressed={isConfirmPasswordVisible}
                aria-label={
                  isConfirmPasswordVisible
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {isConfirmPasswordVisible ? "Hide" : "Show"}
              </Button>
            }
          />
          {fieldErrors.confirmPassword !== undefined ? (
            <FieldError
              id="confirmPassword-error"
              message={fieldErrors.confirmPassword}
            />
          ) : undefined}
        </FormField>

        <Button type="submit" className="mt-1">
          Sign Up
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Have an account already?{" "}
        <Link
          href="/login"
          className="font-semibold text-ink underline underline-offset-2"
        >
          Log in
        </Link>
      </p>
    </section>
  );
}
