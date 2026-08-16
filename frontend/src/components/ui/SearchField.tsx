import { FormField } from "./FormField";
import { Input } from "./Input";
import { Label } from "./Label";

type SearchFieldProps = Readonly<{
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}>;

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20 16.5 16.5" />
    </svg>
  );
}

export function SearchField({
  id,
  label,
  placeholder,
  value,
  onChange,
  className = "w-full sm:w-72",
}: SearchFieldProps) {
  return (
    <FormField className={className}>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <Input
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        startIcon={<SearchIcon />}
        onChange={(changeEvent) => onChange(changeEvent.target.value)}
      />
    </FormField>
  );
}
