type StatusPillProps = {
  label: string;
  tone?: "accent" | "muted";
};

export function StatusPill({ label, tone = "accent" }: StatusPillProps) {
  const toneClasses =
    tone === "muted"
      ? "border-border-ui bg-page text-text-secondary"
      : "border-coral/50 bg-coral/15 text-coral";

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${toneClasses}`}
    >
      {label}
    </span>
  );
}
