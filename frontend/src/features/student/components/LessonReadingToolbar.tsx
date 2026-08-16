import type { LessonContrast, LessonTextSize } from "@/helpers/lessonReadingPrefs";

type LessonReadingToolbarProps = Readonly<{
  textSize: LessonTextSize;
  contrast: LessonContrast;
  onTextSizeChange: (textSize: LessonTextSize) => void;
  onContrastChange: (contrast: LessonContrast) => void;
}>;

const textSizeOptions: { id: LessonTextSize; label: string }[] = [
  { id: "default", label: "Default" },
  { id: "large", label: "Large" },
  { id: "extra-large", label: "Extra large" },
];

const contrastOptions: { id: LessonContrast; label: string }[] = [
  { id: "standard", label: "Standard" },
  { id: "high", label: "High contrast" },
  { id: "dark", label: "Dark" },
];

export function LessonReadingToolbar({
  textSize,
  contrast,
  onTextSizeChange,
  onContrastChange,
}: LessonReadingToolbarProps) {
  return (
    <aside
      aria-label="Reading preferences"
      title="Changes apply to this lesson and stay on this device."
      className="lesson-reading-toolbar flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
    >
      <p className="text-sm font-semibold">Reading display</p>
      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="px-0 text-xs font-medium">Text size</legend>
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {textSizeOptions.map((option) => {
              const isSelected = option.id === textSize;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onTextSizeChange(option.id)}
                    className="lesson-reading-choice"
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="px-0 text-xs font-medium">Contrast</legend>
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {contrastOptions.map((option) => {
              const isSelected = option.id === contrast;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onContrastChange(option.id)}
                    className="lesson-reading-choice"
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      </section>
    </aside>
  );
}
