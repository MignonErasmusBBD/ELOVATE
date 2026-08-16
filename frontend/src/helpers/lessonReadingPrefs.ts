export type LessonTextSize = "default" | "large" | "extra-large";
export type LessonContrast = "standard" | "high" | "dark";

export type LessonReadingPrefs = {
  textSize: LessonTextSize;
  contrast: LessonContrast;
};

export const DEFAULT_LESSON_READING_PREFS: LessonReadingPrefs = {
  textSize: "default",
  contrast: "standard",
};

const STORAGE_KEY = "elovate-lesson-reading";

function parseTextSize(value: unknown): LessonTextSize | undefined {
  if (value === "default" || value === "large" || value === "extra-large") {
    return value;
  }
  return undefined;
}

function parseContrast(value: unknown): LessonContrast | undefined {
  if (value === "standard" || value === "high" || value === "dark") {
    return value;
  }
  return undefined;
}

export function readLessonReadingPrefs(): LessonReadingPrefs {
  if (typeof window === "undefined") {
    return DEFAULT_LESSON_READING_PREFS;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null || raw === "") {
    return DEFAULT_LESSON_READING_PREFS;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return DEFAULT_LESSON_READING_PREFS;
    }
    const textSize = parseTextSize(Reflect.get(parsed, "textSize"));
    const contrast = parseContrast(Reflect.get(parsed, "contrast"));
    return {
      textSize:
        textSize === undefined
          ? DEFAULT_LESSON_READING_PREFS.textSize
          : textSize,
      contrast:
        contrast === undefined
          ? DEFAULT_LESSON_READING_PREFS.contrast
          : contrast,
    };
  } catch {
    return DEFAULT_LESSON_READING_PREFS;
  }
}

export function writeLessonReadingPrefs(prefs: LessonReadingPrefs) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
