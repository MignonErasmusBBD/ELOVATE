import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "ghost" | "compact" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isBusy?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "w-full rounded-lg bg-coral px-4 py-3.5 text-sm font-semibold uppercase tracking-wide text-white focus-coral hover:brightness-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
  ghost:
    "rounded-md bg-transparent px-2 py-1 text-sm font-semibold uppercase tracking-wide text-ink hover:bg-ink/5",
  compact:
    "rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white focus-coral hover:brightness-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
  outline:
    "rounded-lg border border-ink bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-page disabled:cursor-not-allowed disabled:opacity-60",
};

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  isBusy = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled === true || isBusy}
      className={`inline-flex items-center justify-center gap-2 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isBusy ? <Spinner className="size-4" /> : undefined}
      {children}
    </button>
  );
}
