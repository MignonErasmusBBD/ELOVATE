type CorrectReasonNoticeProps = Readonly<{
  reason: string | undefined;
  className?: string;
}>;

export function CorrectReasonNotice({
  reason,
  className = "mt-3",
}: CorrectReasonNoticeProps) {
  if (reason === undefined) {
    return undefined;
  }

  return (
    <p className={`${className} text-sm leading-relaxed text-ink`}>
      <span className="font-semibold">Why this is correct: </span>
      {reason}
    </p>
  );
}
