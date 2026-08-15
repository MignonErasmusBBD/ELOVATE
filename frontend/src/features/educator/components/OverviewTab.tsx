"use client";

import type { EducatorCourseOverview } from "@/helpers/educatorOverviewApi";
import { BloomDifficultyBarChart } from "./BloomDifficultyBarChart";
import { BloomRadarChart } from "./BloomRadarChart";
import { InterventionRuleFlagChart } from "./InterventionRuleFlagChart";
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

export function OverviewTab({ overview }: OverviewTabProps) {
  const showBloomCoverage = hasBloomCoverageData(overview.bloomCoverage);
  const showSections = hasSectionData(overview.questionSections);
  const showBloomDifficulty = hasBloomDifficultyData(overview.bloomDifficulty);
  const showInterventions = overview.interventionRuleFlags.length > 0;

  return (
    <section aria-labelledby="educator-overview-heading" className="mt-6">
      <h2 id="educator-overview-heading" className="sr-only">
        Overview
      </h2>
      <ul className="grid list-none grid-cols-1 gap-6 p-0 xl:grid-cols-2">
        <li>
          <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
            <h3 className="text-base font-bold text-ink">
              Bloom&apos;s Taxonomy: Questions Coverage &amp; Average
              Performance
            </h3>
            {showBloomCoverage ? (
              <BloomRadarChart bloomCoverage={overview.bloomCoverage} />
            ) : (
              <ChartEmptyState message="No questions or learner performance yet for Bloom coverage." />
            )}
          </article>
        </li>
        <li>
          <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
            <h3 className="text-base font-bold text-ink">
              Question Section Overview
            </h3>
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
            <h3 className="text-base font-bold text-ink">
              Question by Bloom &amp; Difficulty
            </h3>
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
            <h3 className="text-base font-bold text-ink">
              Intervention Rule Set Flag
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Number of students flagged by each intervention rule.
            </p>
            {showInterventions ? (
              <InterventionRuleFlagChart
                interventionRuleFlags={overview.interventionRuleFlags}
              />
            ) : (
              <ChartEmptyState message="No open intervention flags for this course." />
            )}
          </article>
        </li>
      </ul>
    </section>
  );
}
