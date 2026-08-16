import { elovateApiJson } from "@/helpers/elovateApi";
import {
  isPlainObject,
  readObjectList,
  readOptionalBoolean,
  readOptionalNumber,
  readOptionalString,
  readRequiredString,
} from "@/helpers/jsonFields";

export type TrendAttempt = {
  attemptNumber: number;
  scorePercent: number;
};

export type BreakdownCategory = {
  categoryName: string;
  questionsAnswered: number;
  scorePercent: number;
};

export type RecommendationCategory =
  | "needs_reinforcement"
  | "take_your_time"
  | "talk_to_educator";

export type RecommendationCta = "quiz" | "content" | "none";

export type StudentRecommendation = {
  id: string;
  flagType: string;
  category: RecommendationCategory;
  sentence: string;
  evidence: string;
  cta: RecommendationCta;
  sectionId: string | undefined;
  sectionTitle: string | undefined;
};

export type StudentCourseDashboard = {
  totalAttempts: number;
  avgScorePercent: number | undefined;
  avgTimeSeconds: number | undefined;
  overallAvgScorePercent: number | undefined;
  trendAttempts: TrendAttempt[];
  bloomBreakdown: BreakdownCategory[];
  sectionBreakdown: BreakdownCategory[];
  difficultyBreakdown: BreakdownCategory[];
  streakAboveTarget: number;
  mostImprovedCategory: string | undefined;
  growthDeltaPercent: number | undefined;
  regressionFlag: boolean;
  stalledFlag: boolean;
  bestScorePercent: number | undefined;
  firstAttemptScorePercent: number | undefined;
  recommendations: StudentRecommendation[];
};

function parseTrendAttempt(item: unknown): TrendAttempt | undefined {
  if (isPlainObject(item) === false) return undefined;
  const attemptNumber = readOptionalNumber(item, "attemptNumber");
  const scorePercent = readOptionalNumber(item, "scorePercent");
  if (attemptNumber === undefined || scorePercent === undefined) return undefined;
  return { attemptNumber, scorePercent };
}

function parseBreakdownCategory(item: unknown): BreakdownCategory | undefined {
  if (isPlainObject(item) === false) return undefined;
  const categoryName = readOptionalString(item, "categoryName");
  const questionsAnswered = readOptionalNumber(item, "questionsAnswered");
  const scorePercent = readOptionalNumber(item, "scorePercent");
  if (
    categoryName === undefined ||
    questionsAnswered === undefined ||
    scorePercent === undefined
  ) {
    return undefined;
  }
  return { categoryName, questionsAnswered, scorePercent };
}

function parseList<T>(
  body: object,
  key: string,
  parse: (item: unknown) => T | undefined,
): T[] {
  const items = readObjectList(body, key);
  const result: T[] = [];
  for (const item of items) {
    const parsed = parse(item);
    if (parsed !== undefined) result.push(parsed);
  }
  return result;
}

const VALID_CATEGORIES: ReadonlySet<string> = new Set([
  "needs_reinforcement",
  "take_your_time",
  "talk_to_educator",
]);

const VALID_CTAS: ReadonlySet<string> = new Set(["quiz", "content", "none"]);

function parseRecommendation(
  item: unknown,
): StudentRecommendation | undefined {
  if (isPlainObject(item) === false) return undefined;
  const id = readRequiredString(item, "id");
  const flagType = readOptionalString(item, "flagType");
  const category = readOptionalString(item, "category");
  const sentence = readOptionalString(item, "sentence");
  const evidence = readOptionalString(item, "evidence");
  const cta = readOptionalString(item, "cta");
  if (
    id === undefined ||
    flagType === undefined ||
    category === undefined ||
    !VALID_CATEGORIES.has(category) ||
    sentence === undefined ||
    evidence === undefined ||
    cta === undefined ||
    !VALID_CTAS.has(cta)
  ) {
    return undefined;
  }
  return {
    id,
    flagType,
    category: category as RecommendationCategory,
    sentence,
    evidence,
    cta: cta as RecommendationCta,
    sectionId: readOptionalString(item, "sectionId"),
    sectionTitle: readOptionalString(item, "sectionTitle"),
  };
}

export function parseStudentCourseDashboard(
  body: unknown,
): StudentCourseDashboard | undefined {
  if (isPlainObject(body) === false) return undefined;

  const totalAttempts = readOptionalNumber(body, "totalAttempts") ?? 0;
  const streakAboveTarget = readOptionalNumber(body, "streakAboveTarget") ?? 0;
  const regressionFlag = readOptionalBoolean(body, "regressionFlag") ?? false;
  const stalledFlag = readOptionalBoolean(body, "stalledFlag") ?? false;

  return {
    totalAttempts,
    avgScorePercent: readOptionalNumber(body, "avgScorePercent"),
    avgTimeSeconds: readOptionalNumber(body, "avgTimeSeconds"),
    overallAvgScorePercent: readOptionalNumber(body, "overallAvgScorePercent"),
    trendAttempts: parseList(body, "trendAttempts", parseTrendAttempt),
    bloomBreakdown: parseList(body, "bloomBreakdown", parseBreakdownCategory),
    sectionBreakdown: parseList(body, "sectionBreakdown", parseBreakdownCategory),
    difficultyBreakdown: parseList(body, "difficultyBreakdown", parseBreakdownCategory),
    streakAboveTarget,
    mostImprovedCategory: readOptionalString(body, "mostImprovedCategory"),
    growthDeltaPercent: readOptionalNumber(body, "growthDeltaPercent"),
    regressionFlag,
    stalledFlag,
    bestScorePercent: readOptionalNumber(body, "bestScorePercent"),
    firstAttemptScorePercent: readOptionalNumber(body, "firstAttemptScorePercent"),
    recommendations: parseList(body, "recommendations", parseRecommendation),
  };
}

export async function getStudentCourseDashboard(
  courseId: string,
): Promise<StudentCourseDashboard> {
  const body = await elovateApiJson(
    `/analytics/me/courses/${courseId}/dashboard`,
  );
  const dashboard = parseStudentCourseDashboard(body);
  if (dashboard === undefined) {
    throw new Error("Student dashboard response was invalid.");
  }
  return dashboard;
}

export async function getEducatorStudentCourseDashboard(
  courseId: string,
  userId: string,
): Promise<StudentCourseDashboard> {
  const body = await elovateApiJson(
    `/analytics/educator/courses/${encodeURIComponent(courseId)}/students/${encodeURIComponent(userId)}/dashboard`,
  );
  const dashboard = parseStudentCourseDashboard(body);
  if (dashboard === undefined) {
    throw new Error("Educator student dashboard response was invalid.");
  }
  return dashboard;
}
