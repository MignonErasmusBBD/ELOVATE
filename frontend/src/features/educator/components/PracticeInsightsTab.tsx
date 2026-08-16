"use client";

import { useState } from "react";
import { ExplainTip } from "@/components/ui/ExplainTip";
import { StatusPill } from "@/components/ui/StatusPill";
import { explainCopy } from "@/helpers/explainCopy";
import type {
  EducatorCoursePracticeInsights,
  QuestionSuccessStat,
} from "@/helpers/educatorPracticeInsightsApi";
import { AttemptProgressChart } from "./AttemptProgressChart";
import { CourseGrowthHighlights } from "./CourseGrowthHighlights";
import {
  QuestionSuccessFilterToggle,
  type QuestionSuccessFilterId,
} from "./QuestionSuccessFilterToggle";
import { QuestionSuccessHealthDonut } from "./QuestionSuccessHealthDonut";
import { ScoreDistributionChart } from "./ScoreDistributionChart";

type PracticeInsightsTabProps = {
  insights: EducatorCoursePracticeInsights;
};

const HIGH_SUCCESS_PERCENT = 95;
const LOW_SUCCESS_PERCENT = 30;
const HIGH_SUCCESS_DISPLAY_MINIMUM = 5;

function ChartEmptyState({ message }: { message: string }) {
  return (
    <p className="mt-6 rounded-xl border border-dashed border-border-ui bg-page px-4 py-10 text-center text-sm text-text-secondary">
      {message}
    </p>
  );
}

function InsightsList({
  headingId,
  title,
  insights,
}: {
  headingId: string;
  title: string;
  insights: string[];
}) {
  return (
    <section
      aria-labelledby={headingId}
      className="mt-4 rounded-xl border border-ink/15 bg-ink/5 p-5"
    >
      <h3 id={headingId} className="text-base font-bold text-ink">
        {title}
      </h3>
      {insights.length === 0 ? (
        <p className="mt-2 text-sm text-text-secondary">
          No insights available yet.
        </p>
      ) : (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-text-secondary">
          {insights.map((insight) => (
            <li key={insight}>{insight}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function sortBySuccessDescending(
  questions: QuestionSuccessStat[],
): QuestionSuccessStat[] {
  return [...questions].sort((left, right) => {
    if (right.successRatePercent !== left.successRatePercent) {
      return right.successRatePercent - left.successRatePercent;
    }
    if (right.timesAnswered !== left.timesAnswered) {
      return right.timesAnswered - left.timesAnswered;
    }
    return left.promptPreview.localeCompare(right.promptPreview);
  });
}

function sortBySuccessAscending(
  questions: QuestionSuccessStat[],
): QuestionSuccessStat[] {
  return [...questions].sort((left, right) => {
    if (left.successRatePercent !== right.successRatePercent) {
      return left.successRatePercent - right.successRatePercent;
    }
    if (right.timesAnswered !== left.timesAnswered) {
      return right.timesAnswered - left.timesAnswered;
    }
    return left.promptPreview.localeCompare(right.promptPreview);
  });
}

function selectHighSuccessQuestions(questions: QuestionSuccessStat[]): {
  questions: QuestionSuccessStat[];
  usedEasiestFallback: boolean;
} {
  const aboveThreshold = sortBySuccessDescending(
    questions.filter(
      (question) => question.successRatePercent > HIGH_SUCCESS_PERCENT,
    ),
  );

  if (aboveThreshold.length >= HIGH_SUCCESS_DISPLAY_MINIMUM) {
    return {
      questions: aboveThreshold,
      usedEasiestFallback: false,
    };
  }

  const easiestQuestions = sortBySuccessDescending(questions).slice(
    0,
    Math.min(HIGH_SUCCESS_DISPLAY_MINIMUM, questions.length),
  );

  return {
    questions: easiestQuestions,
    usedEasiestFallback: true,
  };
}

function selectLowSuccessQuestions(
  questions: QuestionSuccessStat[],
): QuestionSuccessStat[] {
  return sortBySuccessAscending(
    questions.filter((question) => {
      if (question.timesAnswered <= 0) {
        return false;
      }
      return question.flag === "too_hard";
    }),
  );
}

function insightForLowSuccessQuestion(question: QuestionSuccessStat): string {
  const base = `Only ${question.successRatePercent}% of ${question.timesAnswered} answers were correct in “${question.sectionTitle}”.`;

  if (question.timesAnswered < 3) {
    return `${base} The sample is still small — gather a few more attempts before a full rewrite, but review the stem and options now.`;
  }

  if (question.status === "active") {
    return `${base} Revise the wording, distractors, or related learning content. It is still active, so prioritise a fix or temporary deactivation.`;
  }

  return `${base} Revise the wording, distractors, or related learning content before reactivating.`;
}

function answerCountLabel(timesAnswered: number): string {
  if (timesAnswered === 1) {
    return "1 answer";
  }
  return `${timesAnswered} answers`;
}

function hasAttemptProgressData(
  insights: EducatorCoursePracticeInsights,
): boolean {
  for (const average of insights.attemptProgress.attemptAverages) {
    if (average.studentCount > 0) {
      return true;
    }
  }
  return false;
}

function hasDistributionData(
  insights: EducatorCoursePracticeInsights,
): boolean {
  return (
    insights.scoreDistribution.studentCount > 0 &&
    insights.scoreDistribution.densityCurve.length > 0
  );
}

function hasQuestionSuccessData(
  insights: EducatorCoursePracticeInsights,
): boolean {
  return insights.questionSuccess.answeredQuestionCount > 0;
}

function NeedsRevisionQuestionList({
  headingId,
  title,
  description,
  questions,
  emptyMessage,
}: {
  headingId: string;
  title: string;
  description: string;
  questions: QuestionSuccessStat[];
  emptyMessage: string;
}) {
  let activeNeedsRevisionCount = 0;
  for (const question of questions) {
    if (question.status === "active") {
      activeNeedsRevisionCount += 1;
    }
  }

  const summaryInsight =
    questions.length === 0
      ? undefined
      : activeNeedsRevisionCount > 0
        ? `${activeNeedsRevisionCount} active question${activeNeedsRevisionCount === 1 ? "" : "s"} under ${LOW_SUCCESS_PERCENT}% success. Prioritise rewriting the stem, options, or related learning content.`
        : `These questions sit under ${LOW_SUCCESS_PERCENT}% success and are inactive. Revise them before bringing them back into practice.`;

  return (
    <section aria-labelledby={headingId} className="mt-4">
      <header className="mb-3">
        <h4 id={headingId} className="text-sm font-semibold text-ink">
          {title}
          {questions.length > 0 ? (
            <span className="ml-2 text-xs font-medium text-text-secondary">
              ({questions.length})
            </span>
          ) : undefined}
        </h4>
        <p className="mt-1 text-xs text-text-secondary">{description}</p>
      </header>

      {questions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-ui bg-page px-4 py-8 text-center text-sm text-text-secondary">
          {emptyMessage}
        </p>
      ) : (
        <>
          {summaryInsight === undefined ? undefined : (
            <p
              role="status"
              className="rounded-xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm leading-relaxed text-ink"
            >
              {summaryInsight}
            </p>
          )}

          <ul className="mt-3 list-none divide-y divide-border-ui overflow-hidden rounded-xl border border-border-ui bg-surface p-0">
            {questions.map((question) => (
              <li
                key={question.questionId}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-4"
              >
                <p
                  className="m-0 w-14 shrink-0 text-center"
                  aria-label={`${question.successRatePercent}% success`}
                >
                  <span className="inline-flex min-w-14 flex-col items-center rounded-lg bg-coral/10 px-2 py-1.5">
                    <span className="text-base font-bold tabular-nums text-coral">
                      {question.successRatePercent}%
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-coral/80">
                      success
                    </span>
                  </span>
                </p>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-ink">
                    {question.promptPreview}
                  </p>
                  <ul className="mt-2 flex list-none flex-wrap items-center gap-2 p-0">
                    <li>
                      <span className="text-xs text-text-secondary">
                        {answerCountLabel(question.timesAnswered)}
                      </span>
                    </li>
                    <li aria-hidden="true" className="text-xs text-border-ui">
                      ·
                    </li>
                    <li>
                      <span className="text-xs text-text-secondary">
                        {question.sectionTitle}
                      </span>
                    </li>
                    <li>
                      <StatusPill
                        label={
                          question.status === "active" ? "Active" : "Inactive"
                        }
                        tone={
                          question.status === "active" ? "success" : "muted"
                        }
                      />
                    </li>
                    <li>
                      <StatusPill label="Needs revision" tone="danger" />
                    </li>
                  </ul>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {insightForLowSuccessQuestion(question)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function HighSuccessQuestionList({
  headingId,
  title,
  description,
  questions,
  emptyMessage,
  usedEasiestFallback,
}: {
  headingId: string;
  title: string;
  description: string;
  questions: QuestionSuccessStat[];
  emptyMessage: string;
  usedEasiestFallback: boolean;
}) {
  let activeHighSuccessCount = 0;
  for (const question of questions) {
    if (
      question.status === "active" &&
      question.successRatePercent > HIGH_SUCCESS_PERCENT
    ) {
      activeHighSuccessCount += 1;
    }
  }

  const summaryInsight = usedEasiestFallback
    ? `Fewer than ${HIGH_SUCCESS_DISPLAY_MINIMUM} questions clear ${HIGH_SUCCESS_PERCENT}% success, so these are the easiest answered items in the course. Review whether they still earn a place in practice quizzes.`
    : activeHighSuccessCount > 0
      ? `${activeHighSuccessCount} active question${activeHighSuccessCount === 1 ? "" : "s"} above ${HIGH_SUCCESS_PERCENT}% — little challenge left. Consider deactivating them from the Questions tab.`
      : `These questions sit above ${HIGH_SUCCESS_PERCENT}% success. They are already inactive; keep them retired unless you want an easy warm-up.`;

  return (
    <section aria-labelledby={headingId} className="mt-4">
      <header className="mb-3">
        <h4 id={headingId} className="text-sm font-semibold text-ink">
          {title}
          {questions.length > 0 ? (
            <span className="ml-2 text-xs font-medium text-text-secondary">
              ({questions.length})
            </span>
          ) : undefined}
        </h4>
        <p className="mt-1 text-xs text-text-secondary">{description}</p>
      </header>

      {questions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-ui bg-page px-4 py-8 text-center text-sm text-text-secondary">
          {emptyMessage}
        </p>
      ) : (
        <>
          <p
            role="status"
            className="rounded-xl border border-amber-500/25 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-ink"
          >
            {summaryInsight}
          </p>

          <ul className="mt-3 list-none divide-y divide-border-ui overflow-hidden rounded-xl border border-border-ui bg-surface p-0">
            {questions.map((question) => (
              <li
                key={question.questionId}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-4"
              >
                <p
                  className="m-0 w-14 shrink-0 text-center"
                  aria-label={`${question.successRatePercent}% success`}
                >
                  <span className="inline-flex min-w-14 flex-col items-center rounded-lg bg-amber-50 px-2 py-1.5">
                    <span className="text-base font-bold tabular-nums text-amber-800">
                      {question.successRatePercent}%
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-amber-700/80">
                      success
                    </span>
                  </span>
                </p>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-ink">
                    {question.promptPreview}
                  </p>
                  <ul className="mt-2 flex list-none flex-wrap items-center gap-2 p-0">
                    <li>
                      <span className="text-xs text-text-secondary">
                        {answerCountLabel(question.timesAnswered)}
                      </span>
                    </li>
                    <li aria-hidden="true" className="text-xs text-border-ui">
                      ·
                    </li>
                    <li>
                      <span className="text-xs text-text-secondary">
                        {question.sectionTitle}
                      </span>
                    </li>
                    <li>
                      <StatusPill
                        label={
                          question.status === "active" ? "Active" : "Inactive"
                        }
                        tone={
                          question.status === "active" ? "success" : "muted"
                        }
                      />
                    </li>
                    {question.successRatePercent <= HIGH_SUCCESS_PERCENT ? (
                      <li>
                        <StatusPill label="Easiest in course" tone="warning" />
                      </li>
                    ) : undefined}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export function PracticeInsightsTab({ insights }: PracticeInsightsTabProps) {
  const [questionSuccessFilterId, setQuestionSuccessFilterId] =
    useState<QuestionSuccessFilterId>("all");

  const showAttemptProgress = hasAttemptProgressData(insights);
  const showDistribution = hasDistributionData(insights);
  const showQuestionSuccess = hasQuestionSuccessData(insights);

  const tooHardQuestions = insights.questionSuccess.questions.filter(
    (question) => question.flag === "too_hard",
  );
  const tooEasyQuestions = insights.questionSuccess.questions.filter(
    (question) => question.flag === "too_easy",
  );

  let balancedQuestionCount = 0;
  let insufficientDataCount = 0;
  for (const question of insights.questionSuccess.questions) {
    if (question.flag === "balanced") {
      balancedQuestionCount += 1;
    }
    if (question.flag === "insufficient_data") {
      insufficientDataCount += 1;
    }
  }

  const highSuccessSelection = selectHighSuccessQuestions(
    insights.questionSuccess.questions,
  );
  const lowSuccessQuestions = selectLowSuccessQuestions(
    insights.questionSuccess.questions,
  );

  return (
    <section aria-labelledby="educator-practice-insights-heading" className="mt-6">
      <h2 id="educator-practice-insights-heading" className="sr-only">
        Practice Insights
      </h2>

      <ul className="grid list-none grid-cols-1 gap-6 p-0">
        <li>
          <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
            <header>
              <h3 className="flex items-start justify-between gap-2 text-base font-bold text-ink">
                <span className="min-w-0">Practice attempt progress</span>
                <ExplainTip label="About practice attempt progress">
                  {explainCopy.practiceAttemptProgress}
                </ExplainTip>
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Class average (coral), course-wide average (dark dotted), and any
                outlier learners (±2 SD) as named trajectories.
              </p>
            </header>
            {showAttemptProgress ? (
              <AttemptProgressChart
                courseWideAveragePercent={
                  insights.attemptProgress.courseWideAveragePercent
                }
                attemptAverages={insights.attemptProgress.attemptAverages}
                outliers={insights.attemptProgress.outliers}
              />
            ) : (
              <ChartEmptyState message="No completed practice quiz attempts yet for this course." />
            )}
            <InsightsList
              headingId="practice-attempt-insights-heading"
              title="Recommendations & insights"
              insights={insights.attemptInsights}
            />
            <CourseGrowthHighlights highlights={insights.growthHighlights} />
            <InsightsList
              headingId="practice-outlier-insights-heading"
              title="Outlier recommendations"
              insights={insights.outlierInsights}
            />
          </article>
        </li>

        <li>
          <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
            <header>
              <h3 className="flex items-start justify-between gap-2 text-base font-bold text-ink">
                <span className="min-w-0">Score distribution</span>
                <ExplainTip label="About the score distribution">
                  {explainCopy.practiceScoreDistribution}
                </ExplainTip>
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Class score distribution (solid) against an ideal bell curve
                centred at {insights.scoreDistribution.idealMeanPercent}%
                (dotted). Vertical lines mark the class and ideal means.
              </p>
            </header>
            {showDistribution ? (
              <ScoreDistributionChart
                densityCurve={insights.scoreDistribution.densityCurve}
                idealDensityCurve={
                  insights.scoreDistribution.idealDensityCurve
                }
                classMeanPercent={
                  insights.scoreDistribution.classMeanPercent
                }
                idealMeanPercent={
                  insights.scoreDistribution.idealMeanPercent
                }
              />
            ) : (
              <ChartEmptyState message="Not enough learner averages to draw a distribution yet." />
            )}
            <InsightsList
              headingId="practice-distribution-insights-heading"
              title="Recommendations & insights"
              insights={insights.distributionInsights}
            />
          </article>
        </li>

        <li>
          <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_8px_24px_rgba(30,27,51,0.06)]">
            <header>
              <h3 className="flex items-start justify-between gap-2 text-base font-bold text-ink">
                <span className="min-w-0">Question success rates</span>
                <ExplainTip label="About question success rates">
                  {explainCopy.practiceQuestionSuccess}
                </ExplainTip>
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Review the overall mix, then drill into items that need revision
                (&lt;{LOW_SUCCESS_PERCENT}%) or look too easy (&gt;
                {HIGH_SUCCESS_PERCENT}%).
              </p>
            </header>

            {showQuestionSuccess ? (
              <>
                <QuestionSuccessFilterToggle
                  selectedFilterId={questionSuccessFilterId}
                  onSelectFilter={setQuestionSuccessFilterId}
                />

                {questionSuccessFilterId === "all" ? (
                  <>
                    <div className="mt-4 flex justify-center">
                      <QuestionSuccessHealthDonut
                        counts={{
                          tooHardCount: tooHardQuestions.length,
                          tooEasyCount: tooEasyQuestions.length,
                          balancedCount: balancedQuestionCount,
                          insufficientDataCount,
                        }}
                      />
                    </div>
                    <InsightsList
                      headingId="practice-question-success-insights-heading"
                      title="Recommendations & insights"
                      insights={insights.questionSuccessInsights}
                    />
                  </>
                ) : undefined}

                {questionSuccessFilterId === "needs-revision" ? (
                  <NeedsRevisionQuestionList
                    headingId="question-needs-revision-heading"
                    title="Needs revision"
                    description={`Questions under ${LOW_SUCCESS_PERCENT}% success that learners have actually answered (at least 3 attempts).`}
                    questions={lowSuccessQuestions}
                    emptyMessage={`No attempted questions are flagged under ${LOW_SUCCESS_PERCENT}% success yet.`}
                  />
                ) : undefined}

                {questionSuccessFilterId === "high-success" ? (
                  <HighSuccessQuestionList
                    headingId="question-high-success-heading"
                    title="High success"
                    description={
                      highSuccessSelection.usedEasiestFallback
                        ? `Fewer than ${HIGH_SUCCESS_DISPLAY_MINIMUM} questions are above ${HIGH_SUCCESS_PERCENT}%, so the ${highSuccessSelection.questions.length} easiest answered questions in this course are shown.`
                        : `Questions above ${HIGH_SUCCESS_PERCENT}% success — strong candidates to deactivate.`
                    }
                    questions={highSuccessSelection.questions}
                    emptyMessage="No answered questions available to rank by success rate yet."
                    usedEasiestFallback={
                      highSuccessSelection.usedEasiestFallback
                    }
                  />
                ) : undefined}
              </>
            ) : (
              <ChartEmptyState message="No answered practice questions yet for this course." />
            )}
          </article>
        </li>
      </ul>
    </section>
  );
}
