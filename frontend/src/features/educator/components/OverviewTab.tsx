import type { EducatorCourseDashboard } from "../types";
import { BloomDifficultyBarChart } from "./BloomDifficultyBarChart";
import { BloomRadarChart } from "./BloomRadarChart";
import { InterventionRuleFlagChart } from "./InterventionRuleFlagChart";
import { QuestionSectionPolarChart } from "./QuestionSectionPolarChart";

type OverviewTabProps = {
  dashboard: EducatorCourseDashboard;
};

export function OverviewTab({ dashboard }: OverviewTabProps) {
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
            <BloomRadarChart bloomCoverage={dashboard.bloomCoverage} />
          </article>
        </li>
        <li>
          <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
            <h3 className="text-base font-bold text-ink">
              Question Section Overview
            </h3>
            <QuestionSectionPolarChart
              questionSections={dashboard.questionSections}
            />
          </article>
        </li>
        <li className="xl:col-span-2">
          <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
            <h3 className="text-base font-bold text-ink">
              Question by Bloom &amp; Difficulty
            </h3>
            <BloomDifficultyBarChart
              bloomDifficulty={dashboard.bloomDifficulty}
            />
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
            <InterventionRuleFlagChart
              interventionRuleFlags={dashboard.interventionRuleFlags}
            />
          </article>
        </li>
      </ul>
    </section>
  );
}
