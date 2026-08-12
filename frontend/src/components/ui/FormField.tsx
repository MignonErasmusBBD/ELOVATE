import type { ReactNode } from "react";

type FormFieldProps = {
  children: ReactNode;
  className?: string;
};

/** Groups a label, control, and error message without using a generic div. */
export function FormField({ children, className = "" }: FormFieldProps) {
  return (
    <fieldset
      className={`m-0 flex min-w-0 flex-col gap-2 border-0 p-0 ${className}`}
    >
      {children}
    </fieldset>
  );
}
