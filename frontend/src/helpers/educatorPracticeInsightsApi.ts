import {
  ElovateApiError,
  fetchElovateApi,
} from "@/helpers/elovateApi";
import {
  isPlainObject,
  readErrorMessage,
  readObjectList,
  readRequiredString,
  readStringList,
} from "@/helpers/jsonFields";

export type PracticeAttemptAverage = {
  attemptNumber: number;
  averagePercent: number;
  studentCount: number;
};

export type PracticeOutlierAttemptScore = {
  attemptNumber: number;
  scorePercent: number;
};

export type PracticeOutlierStudent = {
  userId: string;
  fullName: string;
  meanPercent: number;
  direction: "above" | "below";
  attemptScores: PracticeOutlierAttemptScore[];
};

export type PracticeAttemptProgress = {
  courseWideAveragePercent?: number;
  attemptAverages: PracticeAttemptAverage[];
  outliers: PracticeOutlierStudent[];
};

export type PracticeDensityPoint = {
  scorePercent: number;
  density: number;
};

export type PracticeScoreDistribution = {
  studentCount: number;
  classMeanPercent?: number;
  standardDeviation?: number;
  densityCurve: PracticeDensityPoint[];
  idealDensityCurve: PracticeDensityPoint[];
  idealMeanPercent: number;
  idealStandardDeviation: number;
};

export type QuestionSuccessFlag =
  | "too_easy"
  | "too_hard"
  | "balanced"
  | "insufficient_data";

export type QuestionSuccessStat = {
  questionId: string;
  promptPreview: string;
  sectionTitle: string;
  status: string;
  timesAnswered: number;
  successRatePercent: number;
  flag: QuestionSuccessFlag;
};

export type PracticeQuestionSuccess = {
  questions: QuestionSuccessStat[];
  tooEasyCount: number;
  tooHardCount: number;
  answeredQuestionCount: number;
};

export type EducatorCoursePracticeInsights = {
  courseId: string;
  courseTitle: string;
  attemptProgress: PracticeAttemptProgress;
  scoreDistribution: PracticeScoreDistribution;
  questionSuccess: PracticeQuestionSuccess;
  attemptInsights: string[];
  outlierInsights: string[];
  distributionInsights: string[];
  questionSuccessInsights: string[];
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

function readOptionalNumber(body: object, key: string): number | undefined {
  return readRequiredNumber(body, key);
}

function parseAttemptAverage(
  item: unknown,
): PracticeAttemptAverage | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }
  const attemptNumber = readRequiredNumber(item, "attemptNumber");
  const averagePercent = readRequiredNumber(item, "averagePercent");
  const studentCount = readRequiredNumber(item, "studentCount");
  if (
    attemptNumber === undefined ||
    averagePercent === undefined ||
    studentCount === undefined
  ) {
    return undefined;
  }
  return { attemptNumber, averagePercent, studentCount };
}

function parseOutlierAttemptScore(
  item: unknown,
): PracticeOutlierAttemptScore | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }
  const attemptNumber = readRequiredNumber(item, "attemptNumber");
  const scorePercent = readRequiredNumber(item, "scorePercent");
  if (attemptNumber === undefined || scorePercent === undefined) {
    return undefined;
  }
  return { attemptNumber, scorePercent };
}

function parseOutlierDirection(
  value: string | undefined,
): "above" | "below" | undefined {
  if (value === "above" || value === "below") {
    return value;
  }
  return undefined;
}

function parseOutlierStudent(
  item: unknown,
): PracticeOutlierStudent | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }
  const userId = readRequiredString(item, "userId");
  const fullName = readRequiredString(item, "fullName");
  const meanPercent = readRequiredNumber(item, "meanPercent");
  const direction = parseOutlierDirection(
    readRequiredString(item, "direction"),
  );
  if (
    userId === undefined ||
    fullName === undefined ||
    meanPercent === undefined ||
    direction === undefined
  ) {
    return undefined;
  }
  const attemptScoreItems = readObjectList(item, "attemptScores");
  const attemptScores: PracticeOutlierAttemptScore[] = [];
  for (const scoreItem of attemptScoreItems) {
    const score = parseOutlierAttemptScore(scoreItem);
    if (score !== undefined) {
      attemptScores.push(score);
    }
  }
  return { userId, fullName, meanPercent, direction, attemptScores };
}

function parseAttemptProgress(
  body: object,
): PracticeAttemptProgress | undefined {
  if ("attemptProgress" in body === false) {
    return undefined;
  }
  const field = Reflect.get(body, "attemptProgress");
  if (isPlainObject(field) === false) {
    return undefined;
  }

  const attemptAverageItems = readObjectList(field, "attemptAverages");
  const attemptAverages: PracticeAttemptAverage[] = [];
  for (const item of attemptAverageItems) {
    const average = parseAttemptAverage(item);
    if (average !== undefined) {
      attemptAverages.push(average);
    }
  }

  const outlierItems = readObjectList(field, "outliers");
  const outliers: PracticeOutlierStudent[] = [];
  for (const item of outlierItems) {
    const outlier = parseOutlierStudent(item);
    if (outlier !== undefined) {
      outliers.push(outlier);
    }
  }

  return {
    courseWideAveragePercent: readOptionalNumber(
      field,
      "courseWideAveragePercent",
    ),
    attemptAverages,
    outliers,
  };
}

function parseDensityPoint(item: unknown): PracticeDensityPoint | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }
  const scorePercent = readRequiredNumber(item, "scorePercent");
  const density = readRequiredNumber(item, "density");
  if (scorePercent === undefined || density === undefined) {
    return undefined;
  }
  return { scorePercent, density };
}

function parseScoreDistribution(
  body: object,
): PracticeScoreDistribution | undefined {
  if ("scoreDistribution" in body === false) {
    return undefined;
  }
  const field = Reflect.get(body, "scoreDistribution");
  if (isPlainObject(field) === false) {
    return undefined;
  }

  const studentCount = readRequiredNumber(field, "studentCount");
  if (studentCount === undefined) {
    return undefined;
  }

  const densityItems = readObjectList(field, "densityCurve");
  const densityCurve: PracticeDensityPoint[] = [];
  for (const item of densityItems) {
    const point = parseDensityPoint(item);
    if (point !== undefined) {
      densityCurve.push(point);
    }
  }

  const idealDensityItems = readObjectList(field, "idealDensityCurve");
  const idealDensityCurve: PracticeDensityPoint[] = [];
  for (const item of idealDensityItems) {
    const point = parseDensityPoint(item);
    if (point !== undefined) {
      idealDensityCurve.push(point);
    }
  }

  const idealMeanPercent = readRequiredNumber(field, "idealMeanPercent");
  const idealStandardDeviation = readRequiredNumber(
    field,
    "idealStandardDeviation",
  );
  if (idealMeanPercent === undefined || idealStandardDeviation === undefined) {
    return undefined;
  }

  return {
    studentCount,
    classMeanPercent: readOptionalNumber(field, "classMeanPercent"),
    standardDeviation: readOptionalNumber(field, "standardDeviation"),
    densityCurve,
    idealDensityCurve,
    idealMeanPercent,
    idealStandardDeviation,
  };
}

function parseQuestionSuccessFlag(
  value: string | undefined,
): QuestionSuccessFlag | undefined {
  if (
    value === "too_easy" ||
    value === "too_hard" ||
    value === "balanced" ||
    value === "insufficient_data"
  ) {
    return value;
  }
  return undefined;
}

function parseQuestionSuccessStat(
  item: unknown,
): QuestionSuccessStat | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }
  const questionId = readRequiredString(item, "questionId");
  const promptPreview = readRequiredString(item, "promptPreview");
  const sectionTitle = readRequiredString(item, "sectionTitle");
  const status = readRequiredString(item, "status");
  const timesAnswered = readRequiredNumber(item, "timesAnswered");
  const successRatePercent = readRequiredNumber(item, "successRatePercent");
  const flag = parseQuestionSuccessFlag(readRequiredString(item, "flag"));
  if (
    questionId === undefined ||
    promptPreview === undefined ||
    sectionTitle === undefined ||
    status === undefined ||
    timesAnswered === undefined ||
    successRatePercent === undefined ||
    flag === undefined
  ) {
    return undefined;
  }
  return {
    questionId,
    promptPreview,
    sectionTitle,
    status,
    timesAnswered,
    successRatePercent,
    flag,
  };
}

function parseQuestionSuccess(
  body: object,
): PracticeQuestionSuccess | undefined {
  if ("questionSuccess" in body === false) {
    return undefined;
  }
  const field = Reflect.get(body, "questionSuccess");
  if (isPlainObject(field) === false) {
    return undefined;
  }

  const tooEasyCount = readRequiredNumber(field, "tooEasyCount");
  const tooHardCount = readRequiredNumber(field, "tooHardCount");
  const answeredQuestionCount = readRequiredNumber(
    field,
    "answeredQuestionCount",
  );
  if (
    tooEasyCount === undefined ||
    tooHardCount === undefined ||
    answeredQuestionCount === undefined
  ) {
    return undefined;
  }

  const questionItems = readObjectList(field, "questions");
  const questions: QuestionSuccessStat[] = [];
  for (const item of questionItems) {
    const question = parseQuestionSuccessStat(item);
    if (question !== undefined) {
      questions.push(question);
    }
  }

  return {
    questions,
    tooEasyCount,
    tooHardCount,
    answeredQuestionCount,
  };
}

export function parseEducatorCoursePracticeInsights(
  body: unknown,
): EducatorCoursePracticeInsights | undefined {
  if (isPlainObject(body) === false) {
    return undefined;
  }

  const courseId = readRequiredString(body, "courseId");
  const courseTitle = readRequiredString(body, "courseTitle");
  const attemptProgress = parseAttemptProgress(body);
  const scoreDistribution = parseScoreDistribution(body);
  const questionSuccess = parseQuestionSuccess(body);
  if (
    courseId === undefined ||
    courseTitle === undefined ||
    attemptProgress === undefined ||
    scoreDistribution === undefined ||
    questionSuccess === undefined
  ) {
    return undefined;
  }

  return {
    courseId,
    courseTitle,
    attemptProgress,
    scoreDistribution,
    questionSuccess,
    attemptInsights: readStringList(body, "attemptInsights"),
    outlierInsights: readStringList(body, "outlierInsights"),
    distributionInsights: readStringList(body, "distributionInsights"),
    questionSuccessInsights: readStringList(body, "questionSuccessInsights"),
  };
}

export async function getEducatorCoursePracticeInsights(
  courseId: string,
): Promise<EducatorCoursePracticeInsights> {
  const response = await fetchElovateApi(
    `/analytics/educator/courses/${encodeURIComponent(courseId)}/practice-insights`,
  );
  const responseBody: unknown = await response.json();
  if (response.ok === false) {
    throw new ElovateApiError(
      response.status,
      readErrorMessage(responseBody, "Could not load practice insights."),
    );
  }

  const insights = parseEducatorCoursePracticeInsights(responseBody);
  if (insights === undefined) {
    throw new Error("Practice insights response was invalid.");
  }
  return insights;
}
