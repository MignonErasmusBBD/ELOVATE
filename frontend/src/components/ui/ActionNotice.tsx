type ActionNoticeTone = "success" | "error";

type ActionNoticeProps = Readonly<{
  tone: ActionNoticeTone;
  message: string;
  className?: string;
}>;

export function ActionNotice({
  tone,
  message,
  className = "",
}: ActionNoticeProps) {
  const isError = tone === "error";

  return (
    <p
      role={isError ? "alert" : "status"}
      className={`${
        isError
          ? "rounded-lg border border-coral/30 bg-coral/10 px-3 py-2.5 text-sm text-coral"
          : "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"
      } ${className}`}
    >
      {message}
    </p>
  );
}
