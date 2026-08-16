import type { LessonUnit } from "../types";

type LessonUnitBodyProps = {
  unit: LessonUnit;
};

export function LessonUnitBody({ unit }: LessonUnitBodyProps) {
  const codeSample = unit.codeSample;
  const exercises = unit.exercises;

  return (
    <>
      {unit.paragraphs.map((paragraph, paragraphIndex) => (
        <p
          key={`paragraph-${paragraphIndex}`}
          className="mt-4 break-words text-sm leading-relaxed text-text-secondary md:text-base"
        >
          {paragraph}
        </p>
      ))}
      {codeSample !== undefined ? (
        <pre className="mt-6 max-w-full overflow-x-auto rounded-xl bg-ink p-4 text-sm leading-relaxed text-white">
          <code>{codeSample}</code>
        </pre>
      ) : undefined}
      {exercises !== undefined ? (
        <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-text-secondary md:text-base">
          {exercises.map((exercise, exerciseIndex) => (
            <li key={`exercise-${exerciseIndex}`}>{exercise}</li>
          ))}
        </ol>
      ) : undefined}
    </>
  );
}
