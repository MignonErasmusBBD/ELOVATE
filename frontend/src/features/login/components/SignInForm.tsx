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
  validateEmail,
  validatePassword,
} from "@/features/login/lib/validation";

type FieldErrors = {
  email?: string;
  password?: string;
};

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function validateAll(): FieldErrors {
    return {
      email: validateEmail(email),
      password: validatePassword(password),
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
      const order: (keyof FieldErrors)[] = ["email", "password"];
      const first = order.find((field) => nextErrors[field]);
      if (first) {
        event.currentTarget
          .querySelector<HTMLElement>(`#${first}`)
          ?.focus();
      }
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
          Welcome Back
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          Sign in to resume elevating your skills.
        </p>
      </header>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
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
            aria-describedby={errors.email ? "email-error" : undefined}
            startIcon={<MailIcon className="h-5 w-5" />}
          />
          {errors.email ? (
            <FieldError id="email-error" message={errors.email} />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            invalid={Boolean(errors.password)}
            onChange={(event) => {
              setPassword(event.target.value);
              clearError("password");
            }}
            onBlur={() => {
              if (!submitted && !password) return;
              setErrors((current) => ({
                ...current,
                password: validatePassword(password),
              }));
            }}
            aria-describedby={errors.password ? "password-error" : undefined}
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
            <FieldError id="password-error" message={errors.password} />
          ) : null}
        </div>

        <div className="flex justify-end">
          <Link
            href="/reset-password"
            className="text-sm font-medium text-ink underline-offset-2 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

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
    </div>
  );
}
