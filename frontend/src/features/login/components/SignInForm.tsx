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
import { validateEmail, validatePassword } from "@/helpers/validation";

type SignInFieldErrors = {
  email?: string;
  password?: string;
};

const SIGN_IN_FIELD_ORDER = ["email", "password"] as const;

export function SignInForm() {
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  function buildFieldErrors(): SignInFieldErrors {
    return {
      email: validateEmail(emailAddress),
      password: validatePassword(passwordValue),
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
        SIGN_IN_FIELD_ORDER,
      );
      return;
    }

    router.push("/courses");
  }

  return (
    <section className="flex w-full max-w-md flex-col">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
          Welcome Back
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          Sign in to resume elevating your skills.
        </p>
      </header>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <FormField>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
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
              fieldErrors.email !== undefined ? "email-error" : undefined
            }
            startIcon={<MailIcon className="h-5 w-5" />}
          />
          {fieldErrors.email !== undefined ? (
            <FieldError id="email-error" message={fieldErrors.email} />
          ) : undefined}
        </FormField>

        <FormField>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            value={passwordValue}
            invalid={fieldErrors.password !== undefined}
            onChange={(changeEvent) => {
              setPasswordValue(changeEvent.target.value);
              setFieldErrors((currentFieldErrors) =>
                clearFieldError(currentFieldErrors, "password"),
              );
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
              fieldErrors.password !== undefined ? "password-error" : undefined
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
            <FieldError id="password-error" message={fieldErrors.password} />
          ) : undefined}
        </FormField>

        <Button type="submit" className="mt-1">
          Log In
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-ink underline-offset-2 hover:underline"
        >
          Sign up now
        </Link>
      </p>
    </section>
  );
}
