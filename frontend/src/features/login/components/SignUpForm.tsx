"use client";

import Link from "next/link";
import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { LockIcon } from "@/components/icons/LockIcon";
import { MailIcon } from "@/components/icons/MailIcon";
import {
  hasErrors,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateRequiredName,
} from "@/features/login/lib/validation";

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function SignUpForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function validateAll(): FieldErrors {
    return {
      firstName: validateRequiredName(firstName, "First name"),
      lastName: validateRequiredName(lastName, "Last name"),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
  }

  function clearError(field: keyof FieldErrors) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const nextErrors = validateAll();
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      const ids: Record<keyof FieldErrors, string> = {
        firstName: "firstName",
        lastName: "lastName",
        email: "signup-email",
        password: "signup-password",
        confirmPassword: "confirmPassword",
      };
      const order: (keyof FieldErrors)[] = [
        "firstName",
        "lastName",
        "email",
        "password",
        "confirmPassword",
      ];
      const first = order.find((field) => nextErrors[field]);
      if (first) {
        event.currentTarget
          .querySelector<HTMLElement>(`#${ids[first]}`)
          ?.focus();
      }
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
          Create Account
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          Join ELOVATE and start your customized learning journey.
        </p>
      </header>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="Design"
            value={firstName}
            invalid={Boolean(errors.firstName)}
            onChange={(event) => {
              setFirstName(event.target.value);
              clearError("firstName");
            }}
            onBlur={() => {
              if (!submitted && !firstName) return;
              setErrors((current) => ({
                ...current,
                firstName: validateRequiredName(firstName, "First name"),
              }));
            }}
            aria-describedby={errors.firstName ? "firstName-error" : undefined}
          />
          {errors.firstName ? (
            <FieldError id="firstName-error" message={errors.firstName} />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Withdesigners"
            value={lastName}
            invalid={Boolean(errors.lastName)}
            onChange={(event) => {
              setLastName(event.target.value);
              clearError("lastName");
            }}
            onBlur={() => {
              if (!submitted && !lastName) return;
              setErrors((current) => ({
                ...current,
                lastName: validateRequiredName(lastName, "Last name"),
              }));
            }}
            aria-describedby={errors.lastName ? "lastName-error" : undefined}
          />
          {errors.lastName ? (
            <FieldError id="lastName-error" message={errors.lastName} />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-email">Email Address</Label>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="designwithdesigners@gmail.com"
            value={email}
            invalid={Boolean(errors.email)}
            onChange={(event) => {
              setEmail(event.target.value);
              clearError("email");
            }}
            onBlur={() => {
              if (!submitted && !email) return;
              setErrors((current) => ({
                ...current,
                email: validateEmail(email),
              }));
            }}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            startIcon={<MailIcon className="h-5 w-5" />}
          />
          {errors.email ? (
            <FieldError id="signup-email-error" message={errors.email} />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            invalid={Boolean(errors.password)}
            onChange={(event) => {
              setPassword(event.target.value);
              clearError("password");
              if (errors.confirmPassword && confirmPassword) {
                setErrors((current) => ({
                  ...current,
                  confirmPassword: validateConfirmPassword(
                    event.target.value,
                    confirmPassword,
                  ),
                }));
              }
            }}
            onBlur={() => {
              if (!submitted && !password) return;
              setErrors((current) => ({
                ...current,
                password: validatePassword(password),
              }));
            }}
            aria-describedby={
              errors.password ? "signup-password-error" : undefined
            }
            startIcon={<LockIcon className="h-5 w-5" />}
            endAdornment={
              <Button
                variant="ghost"
                type="button"
                className="text-xs"
                onClick={() => setShowPassword((current) => !current)}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </Button>
            }
          />
          {errors.password ? (
            <FieldError id="signup-password-error" message={errors.password} />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            invalid={Boolean(errors.confirmPassword)}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              clearError("confirmPassword");
            }}
            onBlur={() => {
              if (!submitted && !confirmPassword) return;
              setErrors((current) => ({
                ...current,
                confirmPassword: validateConfirmPassword(
                  password,
                  confirmPassword,
                ),
              }));
            }}
            aria-describedby={
              errors.confirmPassword ? "confirmPassword-error" : undefined
            }
            startIcon={<LockIcon className="h-5 w-5" />}
            endAdornment={
              <Button
                variant="ghost"
                type="button"
                className="text-xs"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-pressed={showConfirmPassword}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </Button>
            }
          />
          {errors.confirmPassword ? (
            <FieldError
              id="confirmPassword-error"
              message={errors.confirmPassword}
            />
          ) : null}
        </div>

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
    </div>
  );
}
