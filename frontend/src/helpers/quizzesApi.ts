import { elovateApiJson } from "./elovateApi";
import {
  isPlainObject,
  readObjectList,
  readOptionalString,
  readRequiredString,
} from "./jsonFields";

export type AttemptOption = {
  id: string;
  optionText: string;
  position: number;
  isCorrect: boolean | undefined;
};

export type AttemptItem = {
  id: string;
  questionId: string;
  prompt: string;
  correctReason: string | undefined;
  selectedOptionId: string | undefined;
  isCorrect: boolean | undefined;
  bloomLevel: string | undefined;
  difficultyLevel: string | undefined;
  sectionTitle: string | undefined;
  options: AttemptOption[];
};

export type QuizAttempt = {
  id: string;
  courseId: string;
  status: "generated" | "in_progress" | "completed" | "abandoned";
  ratingAtGeneration: number;
  ratingAtCompletion: number | undefined;
  startedAt: string | undefined;
  completedAt: string | undefined;
  items: AttemptItem[];
};

function parseOption(raw: unknown): AttemptOption | undefined {
  if (!isPlainObject(raw)) return undefined;
  const id = readRequiredString(raw, "id");
  const optionText = readRequiredString(raw, "optionText");
  if (id === undefined || optionText === undefined) return undefined;
  const positionRaw = Reflect.get(raw, "position");
  const position = typeof positionRaw === "number" ? positionRaw : 0;
  const isCorrectRaw = Reflect.get(raw, "isCorrect");
  const isCorrect =
    typeof isCorrectRaw === "boolean" ? isCorrectRaw : undefined;
  return { id, optionText, position, isCorrect };
}

function parseItem(raw: unknown): AttemptItem | undefined {
  if (!isPlainObject(raw)) return undefined;
  const id = readRequiredString(raw, "id");
  const questionId = readRequiredString(raw, "questionId");
  const prompt = readRequiredString(raw, "prompt");
  if (id === undefined || questionId === undefined || prompt === undefined)
    return undefined;
  const selectedOptionIdRaw = Reflect.get(raw, "selectedOptionId");
  const selectedOptionId =
    typeof selectedOptionIdRaw === "string" && selectedOptionIdRaw !== ""
      ? selectedOptionIdRaw
      : undefined;
  const isCorrectRaw = Reflect.get(raw, "isCorrect");
  const isCorrect =
    typeof isCorrectRaw === "boolean" ? isCorrectRaw : undefined;
  const bloomLevelRaw = Reflect.get(raw, "bloomLevel");
  const bloomLevel =
    typeof bloomLevelRaw === "string" && bloomLevelRaw !== ""
      ? bloomLevelRaw
      : undefined;
  const difficultyLevelRaw = Reflect.get(raw, "difficultyLevel");
  const difficultyLevel =
    typeof difficultyLevelRaw === "string" && difficultyLevelRaw !== ""
      ? difficultyLevelRaw
      : undefined;
  const sectionTitleRaw = Reflect.get(raw, "sectionTitle");
  const sectionTitle =
    typeof sectionTitleRaw === "string" && sectionTitleRaw !== ""
      ? sectionTitleRaw
      : undefined;
  const options = readObjectList(raw, "options").flatMap((opt) => {
    const parsed = parseOption(opt);
    return parsed !== undefined ? [parsed] : [];
  });
  options.sort((a, b) => a.position - b.position);
  return {
    id,
    questionId,
    prompt,
    correctReason: readOptionalString(raw, "correctReason"),
    selectedOptionId,
    isCorrect,
    bloomLevel,
    difficultyLevel,
    sectionTitle,
    options,
  };
}

function parseAttempt(raw: unknown): QuizAttempt {
  if (!isPlainObject(raw)) {
    throw new Error("Invalid quiz attempt response");
  }
  const id = readRequiredString(raw, "id");
  const courseId = readRequiredString(raw, "courseId");
  const status = readRequiredString(raw, "status");
  if (id === undefined || courseId === undefined || status === undefined) {
    throw new Error("Quiz attempt response missing required fields");
  }
  const ratingAtGenerationRaw = Reflect.get(raw, "ratingAtGeneration");
  const ratingAtGeneration =
    typeof ratingAtGenerationRaw === "number" ? ratingAtGenerationRaw : 0;
  const ratingAtCompletionRaw = Reflect.get(raw, "ratingAtCompletion");
  const ratingAtCompletion =
    typeof ratingAtCompletionRaw === "number" ? ratingAtCompletionRaw : undefined;
  const startedAtRaw = Reflect.get(raw, "startedAt");
  const startedAt =
    typeof startedAtRaw === "string" && startedAtRaw !== "" ? startedAtRaw : undefined;
  const completedAtRaw = Reflect.get(raw, "completedAt");
  const completedAt =
    typeof completedAtRaw === "string" && completedAtRaw !== "" ? completedAtRaw : undefined;
  const items = readObjectList(raw, "items").flatMap((item) => {
    const parsed = parseItem(item);
    return parsed !== undefined ? [parsed] : [];
  });
  return {
    id,
    courseId,
    status: status as QuizAttempt["status"],
    ratingAtGeneration,
    ratingAtCompletion,
    startedAt,
    completedAt,
    items,
  };
}

export async function generateQuiz(courseId: string): Promise<QuizAttempt> {
  const json = await elovateApiJson("/quizzes/generate", {
    method: "POST",
    body: JSON.stringify({ courseId }),
  });
  return parseAttempt(json);
}

export async function startQuiz(attemptId: string): Promise<QuizAttempt> {
  const json = await elovateApiJson(`/quizzes/${attemptId}/start`, {
    method: "POST",
  });
  return parseAttempt(json);
}

export async function submitAnswer(
  attemptId: string,
  quizAttemptItemId: string,
  selectedOptionId: string,
): Promise<QuizAttempt> {
  const json = await elovateApiJson(`/quizzes/${attemptId}/answer`, {
    method: "POST",
    body: JSON.stringify({ quizAttemptItemId, selectedOptionId }),
  });
  return parseAttempt(json);
}

export async function completeQuiz(attemptId: string): Promise<QuizAttempt> {
  const json = await elovateApiJson(`/quizzes/${attemptId}/complete`, {
    method: "POST",
  });
  return parseAttempt(json);
}

export async function getAttempt(attemptId: string): Promise<QuizAttempt> {
  const json = await elovateApiJson(`/quizzes/${attemptId}`);
  return parseAttempt(json);
}
