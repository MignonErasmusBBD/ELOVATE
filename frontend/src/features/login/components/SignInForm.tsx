"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { LockIcon } from "@/components/icons/LockIcon";
import { MailIcon } from "@/components/icons/MailIcon";
import {
  clearFieldError,
  focusFirstInvalidField,
  hasFieldErrors,
} from "@/helpers/formErrors";
import { validateEmail, validatePassword } from "@/helpers/validation";
import { authClient } from "@/lib/auth-client";

type SignInFieldErrors = {
  email?: string;
  password?: string;
  form?: string;
};

const SIGN_IN_FIELD_ORDER = ["email", "password"] as const;

export function SignInForm() {
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function buildFieldErrors(): SignInFieldErrors {
    return {
      email: validateEmail(emailAddress),
      password: validatePassword(passwordValue),
    };
  }

  async function handleSubmit(submitEvent: SubmitEvent<HTMLFormElement>) {
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

    setIsSubmitting(true);
    const result = await authClient.signIn.email({
      email: emailAddress,
      password: passwordValue,
      callbackURL: "/dashboard",
    });
    setIsSubmitting(false);

    if (result.error) {
      setFieldErrors({ form: result.error.message ?? "Invalid email or password." });
      return;
    }

    router.push("/dashboard");
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

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-border-ui bg-surface px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-page focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <GoogleIcon className="h-5 w-5 shrink-0" />
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <hr className="flex-1 border-t border-border-ui" />
          <span className="text-xs text-text-secondary">or continue with email</span>
          <hr className="flex-1 border-t border-border-ui" />
        </div>
      </div>

      <form className="mt-4 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
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

        {fieldErrors.form !== undefined ? (
          <p role="alert" className="text-sm text-red-600">{fieldErrors.form}</p>
        ) : undefined}

        <Button type="submit" className="mt-1" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Log In"}
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
