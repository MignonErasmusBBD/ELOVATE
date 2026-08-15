import {
  ElovateApiError,
  fetchElovateApi,
} from "@/helpers/elovateApi";
import {
  isPlainObject,
  readErrorMessage,
  readObjectList,
  readRequiredString,
} from "@/helpers/jsonFields";

export type EducatorOverviewBloomCoverage = {
  levelName: string;
  coverageCount: number;
  performancePercent: number;
};

export type EducatorOverviewQuestionSection = {
  sectionName: string;
  questionCount: number;
};

export type EducatorOverviewBloomDifficulty = {
  levelName: string;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
};

export type EducatorOverviewInterventionFlag = {
  ruleLabel: string;
  flaggedStudentCount: number;
};

export type EducatorCourseOverview = {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  averagePracticeQuizPercent: number;
  totalQuestions: number;
  bloomCoverage: EducatorOverviewBloomCoverage[];
  questionSections: EducatorOverviewQuestionSection[];
  bloomDifficulty: EducatorOverviewBloomDifficulty[];
  interventionRuleFlags: EducatorOverviewInterventionFlag[];
};

function readRequiredNumber(body: object, key: string): number | undefined {
  if (key in body === false) {
    return undefined;
  }
  const field = Reflect.get(body, key);
  if (typeof field !== "number" || Number.isFinite(field) === false) {
    return undefined;
  }
  return field;
}

function parseBloomCoverage(
  item: unknown,
): EducatorOverviewBloomCoverage | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }
  const levelName = readRequiredString(item, "levelName");
  const coverageCount = readRequiredNumber(item, "coverageCount");
  const performancePercent = readRequiredNumber(item, "performancePercent");
  if (
    levelName === undefined ||
    coverageCount === undefined ||
    performancePercent === undefined
  ) {
    return undefined;
  }
  return { levelName, coverageCount, performancePercent };
}

function parseQuestionSection(
  item: unknown,
): EducatorOverviewQuestionSection | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }
  const sectionName = readRequiredString(item, "sectionName");
  const questionCount = readRequiredNumber(item, "questionCount");
  if (sectionName === undefined || questionCount === undefined) {
    return undefined;
  }
  return { sectionName, questionCount };
}

function parseBloomDifficulty(
  item: unknown,
): EducatorOverviewBloomDifficulty | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }
  const levelName = readRequiredString(item, "levelName");
  const easyCount = readRequiredNumber(item, "easyCount");
  const mediumCount = readRequiredNumber(item, "mediumCount");
  const hardCount = readRequiredNumber(item, "hardCount");
  if (
    levelName === undefined ||
    easyCount === undefined ||
    mediumCount === undefined ||
    hardCount === undefined
  ) {
    return undefined;
  }
  return { levelName, easyCount, mediumCount, hardCount };
}

function parseInterventionFlag(
  item: unknown,
): EducatorOverviewInterventionFlag | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }
  const ruleLabel = readRequiredString(item, "ruleLabel");
  const flaggedStudentCount = readRequiredNumber(item, "flaggedStudentCount");
  if (ruleLabel === undefined || flaggedStudentCount === undefined) {
    return undefined;
  }
  return { ruleLabel, flaggedStudentCount };
}

function parseList<T>(
  body: object,
  key: string,
  parseItem: (item: unknown) => T | undefined,
): T[] {
  const items = readObjectList(body, key);
  const parsed: T[] = [];
  for (const item of items) {
    const value = parseItem(item);
    if (value !== undefined) {
      parsed.push(value);
    }
  }
  return parsed;
}

export function parseEducatorCourseOverview(
  body: unknown,
): EducatorCourseOverview | undefined {
  if (isPlainObject(body) === false) {
    return undefined;
  }

  const courseId = readRequiredString(body, "courseId");
  const courseTitle = readRequiredString(body, "courseTitle");
  const totalStudents = readRequiredNumber(body, "totalStudents");
  const averagePracticeQuizPercent = readRequiredNumber(
    body,
    "averagePracticeQuizPercent",
  );
  const totalQuestions = readRequiredNumber(body, "totalQuestions");

  if (
    courseId === undefined ||
    courseTitle === undefined ||
    totalStudents === undefined ||
    averagePracticeQuizPercent === undefined ||
    totalQuestions === undefined
  ) {
    return undefined;
  }

  return {
    courseId,
    courseTitle,
    totalStudents,
    averagePracticeQuizPercent,
    totalQuestions,
    bloomCoverage: parseList(body, "bloomCoverage", parseBloomCoverage),
    questionSections: parseList(body, "questionSections", parseQuestionSection),
    bloomDifficulty: parseList(body, "bloomDifficulty", parseBloomDifficulty),
    interventionRuleFlags: parseList(
      body,
      "interventionRuleFlags",
      parseInterventionFlag,
    ),
  };
}

export async function getEducatorCourseOverview(
  courseId: string,
): Promise<EducatorCourseOverview> {
  const response = await fetchElovateApi(
    `/analytics/educator/courses/${courseId}/overview`,
  );
  const responseBody: unknown = await response.json();
  if (response.ok === false) {
    throw new ElovateApiError(
      response.status,
      readErrorMessage(responseBody, "Could not load course overview."),
    );
  }
  const overview = parseEducatorCourseOverview(responseBody);
  if (overview === undefined) {
    throw new Error("Educator course overview response was invalid.");
  }
  return overview;
}
