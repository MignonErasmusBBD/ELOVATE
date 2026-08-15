type StatusPillTone = "accent" | "muted" | "success" | "warning" | "danger";

type StatusPillProps = Readonly<{
  label: string;
  tone?: StatusPillTone;
}>;

function classesForTone(tone: StatusPillTone): string {
  if (tone === "muted") {
    return "border-border-ui bg-page text-text-secondary";
  }
  if (tone === "success") {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }
  if (tone === "warning") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }
  if (tone === "danger") {
    return "border-coral/50 bg-coral/15 text-coral";
  }
  return "border-coral/50 bg-coral/15 text-coral";
}

export function StatusPill({ label, tone = "accent" }: StatusPillProps) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${classesForTone(tone)}`}
    >
      {label}
    </span>
  );
}
