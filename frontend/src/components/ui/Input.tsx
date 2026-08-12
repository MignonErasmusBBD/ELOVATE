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
    <div className="relative">
      {startIcon ? (
        <span
          className={`pointer-events-none absolute inset-y-0 left-3 flex items-center ${
            invalid ? "text-ink" : "text-text-secondary"
          }`}
        >
          {startIcon}
        </span>
      ) : null}
      <input
        id={id}
        aria-invalid={invalid || undefined}
        className={`w-full rounded-lg bg-surface px-3 py-3 text-ink placeholder:text-text-secondary ${
          invalid
            ? "border-2 border-ink"
            : "border border-border-ui"
        } ${startIcon ? "pl-11" : ""} ${endAdornment ? "pr-16" : ""} ${className}`}
        {...props}
      />
      {endAdornment ? (
        <span className="absolute inset-y-0 right-2 flex items-center">
          {endAdornment}
        </span>
      ) : null}
    </div>
  );
}
