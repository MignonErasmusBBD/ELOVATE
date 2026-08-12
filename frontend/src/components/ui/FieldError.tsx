import { AlertIcon } from "@/components/icons/AlertIcon";

type FieldErrorProps = {
  id: string;
  message: string;
};

export function FieldError({ id, message }: FieldErrorProps) {
  return (
    <p
      id={id}
      className="flex items-start gap-1.5 text-sm font-medium text-ink"
      role="alert"
    >
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
