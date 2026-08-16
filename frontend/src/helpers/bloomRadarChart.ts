export type BloomRadarSourcePoint = {
  levelName: string;
  coverageCount: number;
  performancePercent: number;
};

export type BloomRadarSeriesPoint = {
  levelName: string;
  coverageCount: number;
  coveragePercent: number;
  performancePercent: number;
};

export function toBloomRadarSeriesPoints(
  bloomCoverage: BloomRadarSourcePoint[],
): BloomRadarSeriesPoint[] {
  let totalQuestionCount = 0;
  for (const point of bloomCoverage) {
    totalQuestionCount += point.coverageCount;
  }

  return bloomCoverage.map((point) => ({
    levelName: point.levelName,
    coverageCount: point.coverageCount,
    coveragePercent:
      totalQuestionCount === 0
        ? 0
        : Math.round((point.coverageCount / totalQuestionCount) * 100),
    performancePercent: point.performancePercent,
  }));
}

export function formatBloomCoverageTooltip(
  coveragePercent: number,
  coverageCount: number,
): string {
  const questionLabel = coverageCount === 1 ? "question" : "questions";
  return `${coveragePercent}% of questions (${coverageCount} ${questionLabel})`;
}

export function formatBloomPerformanceTooltip(performancePercent: number): string {
  return `${performancePercent}% correct`;
}
