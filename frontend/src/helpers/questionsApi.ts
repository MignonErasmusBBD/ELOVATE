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

export type QuestionStatus = "active" | "deactivated";

export type ElovateQuestionOption = {
  id: string;
  optionText: string;
  isCorrect: boolean;
  position: number;
};

export type ElovateQuestion = {
  id: string;
  courseSectionId: string;
  courseId: string;
  questionFormatId: number;
  formatCode: string;
  prompt: string;
  bloomLevelId: number;
  difficultyLevelId: number;
  baseDifficulty: number;
  status: QuestionStatus;
  options: ElovateQuestionOption[];
  topicIds: string[];
};

export type QuestionOptionInput = {
  optionText: string;
  isCorrect: boolean;
  position: number;
};

export type CreateQuestionInput = {
  courseSectionId: string;
  questionFormatId: number;
  prompt: string;
  bloomLevelId: number;
  difficultyLevelId: number;
  baseDifficulty: number;
  options: QuestionOptionInput[];
};

export type UpdateQuestionInput = {
  courseSectionId?: string;
  prompt?: string;
  questionFormatId?: number;
  bloomLevelId?: number;
  difficultyLevelId?: number;
  baseDifficulty?: number;
  options?: QuestionOptionInput[];
};

export type ListQuestionsInput = {
  courseId: string;
  status?: QuestionStatus;
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

function readRequiredBoolean(body: object, key: string): boolean | undefined {
  if (key in body === false) {
    return undefined;
  }
  const field = Reflect.get(body, key);
  if (typeof field !== "boolean") {
    return undefined;
  }
  return field;
}

function parseQuestionStatus(value: string | undefined): QuestionStatus | undefined {
  if (value === "active" || value === "deactivated") {
    return value;
  }
  return undefined;
}

function parseQuestionOption(item: unknown): ElovateQuestionOption | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }
  const id = readRequiredString(item, "id");
  const optionText = readRequiredString(item, "optionText");
  const isCorrect = readRequiredBoolean(item, "isCorrect");
  const position = readRequiredNumber(item, "position");
  if (
    id === undefined ||
    optionText === undefined ||
    isCorrect === undefined ||
    position === undefined
  ) {
    return undefined;
  }
  return { id, optionText, isCorrect, position };
}

export function parseElovateQuestion(item: unknown): ElovateQuestion | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }

  const id = readRequiredString(item, "id");
  const courseSectionId = readRequiredString(item, "courseSectionId");
  const courseId = readRequiredString(item, "courseId");
  const questionFormatId = readRequiredNumber(item, "questionFormatId");
  const formatCode = readRequiredString(item, "formatCode");
  const prompt = readRequiredString(item, "prompt");
  const bloomLevelId = readRequiredNumber(item, "bloomLevelId");
  const difficultyLevelId = readRequiredNumber(item, "difficultyLevelId");
  const baseDifficulty = readRequiredNumber(item, "baseDifficulty");
  const status = parseQuestionStatus(readRequiredString(item, "status"));

  if (
    id === undefined ||
    courseSectionId === undefined ||
    courseId === undefined ||
    questionFormatId === undefined ||
    formatCode === undefined ||
    prompt === undefined ||
    bloomLevelId === undefined ||
    difficultyLevelId === undefined ||
    baseDifficulty === undefined ||
    status === undefined
  ) {
    return undefined;
  }

  const options: ElovateQuestionOption[] = [];
  if ("options" in item) {
    const optionItems = Reflect.get(item, "options");
    if (Array.isArray(optionItems)) {
      for (const optionItem of optionItems) {
        const option = parseQuestionOption(optionItem);
        if (option !== undefined) {
          options.push(option);
        }
      }
    }
  }

  const topicIds: string[] = [];
  if ("topicIds" in item) {
    const topicItems = Reflect.get(item, "topicIds");
    if (Array.isArray(topicItems)) {
      for (const topicItem of topicItems) {
        if (typeof topicItem === "string" && topicItem !== "") {
          topicIds.push(topicItem);
        }
      }
    }
  }

  return {
    id,
    courseSectionId,
    courseId,
    questionFormatId,
    formatCode,
    prompt,
    bloomLevelId,
    difficultyLevelId,
    baseDifficulty,
    status,
    options,
    topicIds,
  };
}

function parseQuestionList(body: unknown): ElovateQuestion[] | undefined {
  if (isPlainObject(body) === false) {
    return undefined;
  }
  const items = readObjectList(body, "items");
  const questions: ElovateQuestion[] = [];
  for (const item of items) {
    const question = parseElovateQuestion(item);
    if (question !== undefined) {
      questions.push(question);
    }
  }
  return questions;
}

async function readFailedResponse(
  response: Response,
  fallback: string,
): Promise<never> {
  const responseBody: unknown = await response.json().catch(() => undefined);
  throw new ElovateApiError(
    response.status,
    readErrorMessage(responseBody, fallback),
  );
}

export async function listQuestions(
  input: ListQuestionsInput,
): Promise<ElovateQuestion[]> {
  const queryParams = new URLSearchParams({ courseId: input.courseId });
  if (input.status !== undefined) {
    queryParams.set("status", input.status);
  }

  const response = await fetchElovateApi(`/questions?${queryParams.toString()}`);
  const responseBody: unknown = await response.json();
  if (response.ok === false) {
    throw new ElovateApiError(
      response.status,
      readErrorMessage(responseBody, "Could not load questions."),
    );
  }
  const questions = parseQuestionList(responseBody);
  if (questions === undefined) {
    throw new Error("Question list response was invalid.");
  }
  return questions;
}

export async function createQuestion(
  input: CreateQuestionInput,
): Promise<ElovateQuestion> {
  const response = await fetchElovateApi("/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (response.ok === false) {
    await readFailedResponse(response, "Could not create question.");
  }
  const responseBody: unknown = await response.json();
  const question = parseElovateQuestion(responseBody);
  if (question === undefined) {
    throw new Error("Create question response was invalid.");
  }
  return question;
}

export async function updateQuestion(
  questionId: string,
  input: UpdateQuestionInput,
): Promise<ElovateQuestion> {
  const response = await fetchElovateApi(`/questions/${questionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (response.ok === false) {
    await readFailedResponse(response, "Could not update question.");
  }
  const responseBody: unknown = await response.json();
  const question = parseElovateQuestion(responseBody);
  if (question === undefined) {
    throw new Error("Update question response was invalid.");
  }
  return question;
}

export async function deactivateQuestion(questionId: string): Promise<void> {
  const response = await fetchElovateApi(`/questions/${questionId}/deactivate`, {
    method: "POST",
  });
  if (response.ok === false) {
    await readFailedResponse(response, "Could not deactivate question.");
  }
}

export async function activateQuestion(questionId: string): Promise<void> {
  const response = await fetchElovateApi(`/questions/${questionId}/activate`, {
    method: "POST",
  });
  if (response.ok === false) {
    await readFailedResponse(response, "Could not activate question.");
  }
}

export function baseDifficultyFromRank(rank: number): number {
  if (rank <= 1) {
    return 0.3;
  }
  if (rank === 2) {
    return 0.5;
  }
  if (rank === 3) {
    return 0.7;
  }
  return 0.9;
}
