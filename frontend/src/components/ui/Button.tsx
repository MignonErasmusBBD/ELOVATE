import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "w-full rounded-lg bg-coral px-4 py-3.5 text-sm font-semibold uppercase tracking-wide text-white focus-coral hover:brightness-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
  ghost:
    "rounded-md bg-transparent px-2 py-1 text-sm font-semibold uppercase tracking-wide text-ink hover:bg-ink/5",
};

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
