"use client";

import { ExplainTip } from "@/components/ui/ExplainTip";
import { explainCopy } from "@/helpers/explainCopy";
import type { EducatorCourseOverview } from "@/helpers/educatorOverviewApi";
import { BloomDifficultyBarChart } from "./BloomDifficultyBarChart";
import { BloomRadarChart } from "./BloomRadarChart";
import { QuestionSectionPolarChart } from "./QuestionSectionPolarChart";

type OverviewTabProps = {
  overview: EducatorCourseOverview;
};

function ChartEmptyState({ message }: { message: string }) {
  return (
    <p className="mt-6 rounded-xl border border-dashed border-border-ui bg-page px-4 py-10 text-center text-sm text-text-secondary">
      {message}
    </p>
  );
}

function hasBloomCoverageData(
  bloomCoverage: EducatorCourseOverview["bloomCoverage"],
) {
  for (const point of bloomCoverage) {
    if (point.coverageCount > 0 || point.performancePercent > 0) {
      return true;
    }
  }
  return false;
}

function hasSectionData(
  questionSections: EducatorCourseOverview["questionSections"],
) {
  if (questionSections.length === 0) {
    return false;
  }
  for (const section of questionSections) {
    if (section.questionCount > 0) {
      return true;
    }
  }
  return false;
}

function hasBloomDifficultyData(
  bloomDifficulty: EducatorCourseOverview["bloomDifficulty"],
) {
  for (const entry of bloomDifficulty) {
    if (
      entry.easyCount > 0 ||
      entry.mediumCount > 0 ||
      entry.hardCount > 0
    ) {
      return true;
    }
  }
  return false;
}

type FlagRow = {
  flagLabel: string;
  category: string;
  categoryColor: string;
  condition: string;
  action: string;
};

const FLAG_REFERENCE: FlagRow[] = [
  {
    flagLabel: "Repeated low topic",
    category: "Knowledge gap",
    categoryColor: "#2563eb",
    condition: "Section score stays below 50% across 3 or more questions answered",
    action: "Student reviews the content for that section",
  },
  {
    flagLabel: "Content not retained",
    category: "Knowledge gap",
    categoryColor: "#2563eb",
    condition: "High content view time for a section but quiz score still below 50%",
    action: "Student re-reads the section material",
  },
  {
    flagLabel: "Fast low score",
    category: "Engagement signal",
    categoryColor: "#ea580c",
    condition: "Quiz finished well under the student's typical time AND score below 60%",
    action: "Student slows down and reads each question carefully",
  },
  {
    flagLabel: "Rushed difficult questions",
    category: "Engagement signal",
    categoryColor: "#ea580c",
    condition: "2 or more Hard/Expert questions answered in under 20 s and wrong",
    action: "Student takes more time on harder items",
  },
  {
    flagLabel: "Broad knowledge gap",
    category: "Consider a check-in",
    categoryColor: "#16a34a",
    condition: "More than 70% of sections with enough data are below 50%",
    action: "Educator check-in or differentiated support",
  },
];

export function OverviewTab({ overview }: OverviewTabProps) {
  const showBloomCoverage = hasBloomCoverageData(overview.bloomCoverage);
  const showSections = hasSectionData(overview.questionSections);
  const showBloomDifficulty = hasBloomDifficultyData(overview.bloomDifficulty);

  return (
    <section aria-labelledby="educator-overview-heading" className="mt-6">
      <h2 id="educator-overview-heading" className="sr-only">
        Overview
      </h2>
      <ul className="grid list-none grid-cols-1 gap-6 p-0 xl:grid-cols-2">
        <li>
          <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
            <header>
              <h3 className="flex items-start justify-between gap-2 text-base font-bold text-ink">
                <span className="min-w-0">
                  Bloom&apos;s Taxonomy: Questions Coverage &amp; Average
                  Performance
                </span>
                <ExplainTip label="About Bloom coverage">
                  {explainCopy.bloomCoverage}
                </ExplainTip>
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Both series use a 0–100% scale. Coverage is each Bloom
                level&apos;s share of the question bank; performance is average
                percent correct.
              </p>
            </header>
            {showBloomCoverage ? (
              <BloomRadarChart bloomCoverage={overview.bloomCoverage} />
            ) : (
              <ChartEmptyState message="No questions or learner performance yet for Bloom coverage." />
            )}
          </article>
        </li>
        <li>
          <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
            <header className="flex items-center justify-between gap-2">
              <h3 className="min-w-0 text-base font-bold text-ink">
                Question Section Overview
              </h3>
              <ExplainTip label="About the section chart">
                {explainCopy.questionSections}
              </ExplainTip>
            </header>
            {showSections ? (
              <QuestionSectionPolarChart
                questionSections={overview.questionSections}
              />
            ) : (
              <ChartEmptyState message="Add learning content sections and questions to see this breakdown." />
            )}
          </article>
        </li>
        <li className="xl:col-span-2">
          <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
            <header className="flex items-center justify-between gap-2">
              <h3 className="min-w-0 text-base font-bold text-ink">
                Question by Bloom &amp; Difficulty
              </h3>
              <ExplainTip label="About Bloom and difficulty">
                {explainCopy.bloomDifficulty}
              </ExplainTip>
            </header>
            {showBloomDifficulty ? (
              <BloomDifficultyBarChart
                bloomDifficulty={overview.bloomDifficulty}
              />
            ) : (
              <ChartEmptyState message="No active questions tagged with Bloom and difficulty yet." />
            )}
          </article>
        </li>
        <li className="xl:col-span-2">
          <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
            <header>
              <h3 className="text-base font-bold text-ink">
                Diagnostic Flag Reference
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Flags are automatically raised after each quiz submission and shown in each student&apos;s detail panel. Use this table to understand what triggers each flag and what action is suggested.
              </p>
            </header>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-border-ui pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Flag
                    </th>
                    <th className="border-b border-border-ui pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Category
                    </th>
                    <th className="border-b border-border-ui pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Triggers when…
                    </th>
                    <th className="border-b border-border-ui pb-2 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Recommended action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FLAG_REFERENCE.map((row) => (
                    <tr key={row.flagLabel} className="group">
                      <td className="py-3 pr-4 align-top font-medium text-ink group-last:pb-0">
                        {row.flagLabel}
                      </td>
                      <td className="py-3 pr-4 align-top group-last:pb-0">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            background: `${row.categoryColor}18`,
                            color: row.categoryColor,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: row.categoryColor }}
                          />
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3 pr-4 align-top text-text-secondary group-last:pb-0">
                        {row.condition}
                      </td>
                      <td className="py-3 align-top text-text-secondary group-last:pb-0">
                        {row.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </li>
      </ul>
    </section>
  );
}
