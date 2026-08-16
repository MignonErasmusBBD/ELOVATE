import { ExplainTip } from "@/components/ui/ExplainTip";
import {
  MIN_ACTIVE_QUESTIONS_TO_ACTIVATE,
  MIN_COURSE_SECTIONS_TO_ACTIVATE,
} from "@/helpers/courseReadiness";
import { explainCopy } from "@/helpers/explainCopy";

type CourseReadinessChecklistProps = Readonly<{
  sectionCount: number;
  activeQuestionCount: number;
}>;

function RequirementRow({
  label,
  current,
  required,
}: Readonly<{
  label: string;
  current: number;
  required: number;
}>) {
  const isMet = current >= required;
  return (
    <li className="flex min-w-0 items-start justify-between gap-3 text-sm">
      <span className="min-w-0 break-words text-ink">{label}</span>
      <span
        className={
          isMet
            ? "shrink-0 font-semibold text-emerald-700"
            : "shrink-0 font-semibold text-coral"
        }
      >
        {isMet ? "Met" : "Not met"} ({current}/{required})
      </span>
    </li>
  );
}

export function CourseReadinessChecklist({
  sectionCount,
  activeQuestionCount,
}: CourseReadinessChecklistProps) {
  return (
    <section
      aria-label="Course activation requirements"
      className="rounded-xl border border-border-ui bg-page px-4 py-3"
    >
      <header className="flex items-center gap-1.5">
        <h3 className="text-sm font-semibold text-ink">
          Activation requirements
        </h3>
        <ExplainTip label="About activating a course">
          {explainCopy.courseDraft}
        </ExplainTip>
      </header>
      <p className="mt-1 text-xs text-text-secondary">
        A course can move to active once it has at least one section and 20
        active questions in the question bank.
      </p>
      <ul className="mt-3 flex list-none flex-col gap-2 p-0">
        <RequirementRow
          label="At least one learning section"
          current={sectionCount}
          required={MIN_COURSE_SECTIONS_TO_ACTIVATE}
        />
        <RequirementRow
          label="At least 20 active questions"
          current={activeQuestionCount}
          required={MIN_ACTIVE_QUESTIONS_TO_ACTIVATE}
        />
      </ul>
    </section>
  );
}
