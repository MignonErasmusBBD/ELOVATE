"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
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
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function ResetPasswordForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function validateAll(): FieldErrors {
    return {
      name: validateRequiredName(name, "Name"),
      email: validateEmail(email),
      password: validatePassword(password, "New password"),
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const nextErrors = validateAll();
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      const ids: Record<keyof FieldErrors, string> = {
        name: "reset-name",
        email: "reset-email",
        password: "reset-password",
        confirmPassword: "reset-confirmPassword",
      };
      const order: (keyof FieldErrors)[] = [
        "name",
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
          Reset Password
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          Fill in your verification info to set a new password.
        </p>
      </header>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reset-name">Name</Label>
          <Input
            id="reset-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Design Withdesigners"
            value={name}
            invalid={Boolean(errors.name)}
            onChange={(event) => {
              setName(event.target.value);
              clearError("name");
            }}
            onBlur={() => {
              if (!submitted && !name) return;
              setErrors((current) => ({
                ...current,
                name: validateRequiredName(name, "Name"),
              }));
            }}
            aria-describedby={errors.name ? "reset-name-error" : undefined}
          />
          {errors.name ? (
            <FieldError id="reset-name-error" message={errors.name} />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reset-email">Email Address</Label>
          <Input
            id="reset-email"
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
            aria-describedby={errors.email ? "reset-email-error" : undefined}
            startIcon={<MailIcon className="h-5 w-5" />}
          />
          {errors.email ? (
            <FieldError id="reset-email-error" message={errors.email} />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reset-password">New Password</Label>
          <Input
            id="reset-password"
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
                password: validatePassword(password, "New password"),
              }));
            }}
            aria-describedby={
              errors.password ? "reset-password-error" : undefined
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
            <FieldError id="reset-password-error" message={errors.password} />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reset-confirmPassword">Confirm New Password</Label>
          <Input
            id="reset-confirmPassword"
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
              errors.confirmPassword
                ? "reset-confirmPassword-error"
                : undefined
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
              id="reset-confirmPassword-error"
              message={errors.confirmPassword}
            />
          ) : null}
        </div>

        <Button type="submit" className="mt-1">
          Reset Password
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Remember your credentials?{" "}
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
