import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export function Select({
  className = "",
  invalid = false,
  ...props
}: SelectProps) {
  return (
    <select
      aria-invalid={invalid ? true : undefined}
      className={`w-full rounded-lg bg-surface px-3 py-3 text-ink ${
        invalid ? "border-2 border-ink" : "border border-border-ui"
      } ${className}`}
      {...props}
    />
  );
}
