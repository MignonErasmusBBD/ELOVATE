import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  startIcon?: ReactNode;
  endAdornment?: ReactNode;
  invalid?: boolean;
};

export function Input({
  className = "",
  startIcon,
  endAdornment,
  id,
  invalid = false,
  ...props
}: InputProps) {
  return (
    <span className="relative block">
      {startIcon !== undefined ? (
        <span
          className={`pointer-events-none absolute inset-y-0 left-3 flex items-center ${
            invalid ? "text-ink" : "text-text-secondary"
          }`}
        >
          {startIcon}
        </span>
      ) : undefined}
      <input
        id={id}
        aria-invalid={invalid ? true : undefined}
        className={`w-full rounded-lg bg-surface px-3 py-3 text-ink placeholder:text-text-secondary ${
          invalid ? "border-2 border-ink" : "border border-border-ui"
        } ${startIcon !== undefined ? "pl-11" : ""} ${
          endAdornment !== undefined ? "pr-16" : ""
        } ${className}`}
        {...props}
      />
      {endAdornment !== undefined ? (
        <span className="absolute inset-y-0 right-2 flex items-center">
          {endAdornment}
        </span>
      ) : undefined}
    </span>
  );
}
