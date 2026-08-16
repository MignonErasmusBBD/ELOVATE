import type { LessonUnit } from "../types";

type LessonUnitBodyProps = Readonly<{
  unit: LessonUnit;
}>;

export function LessonUnitBody({ unit }: LessonUnitBodyProps) {
  const codeSample = unit.codeSample;
  const exercises = unit.exercises;

  return (
    <>
      {unit.paragraphs.map((paragraph, paragraphIndex) => (
        <p
          key={`paragraph-${paragraphIndex}`}
          className="lesson-body-text mt-4 break-words"
        >
          {paragraph}
        </p>
      ))}
      {codeSample === undefined ? undefined : (
        <figure className="mt-6">
          <figcaption className="lesson-reading-muted mb-2 text-sm font-semibold">
            Code example
          </figcaption>
          <pre className="lesson-body-code max-w-full overflow-x-auto rounded-xl p-4">
            <code>{codeSample}</code>
          </pre>
        </figure>
      )}
      {exercises === undefined ? undefined : (
        <ol className="lesson-body-text mt-6 list-decimal space-y-3 pl-5">
          {exercises.map((exercise, exerciseIndex) => (
            <li key={`exercise-${exerciseIndex}`}>{exercise}</li>
          ))}
        </ol>
      )}
    </>
  );
}
