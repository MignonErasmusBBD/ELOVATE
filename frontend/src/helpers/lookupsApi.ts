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

export type BloomLevelLookup = {
  bloomLevelId: number;
  name: string;
  rank: number;
};

export type DifficultyLevelLookup = {
  difficultyLevelId: number;
  name: string;
  rank: number;
};

export type QuestionFormatLookup = {
  questionFormatId: number;
  formatCode: string;
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

function parseBloomLevel(item: unknown): BloomLevelLookup | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }
  const bloomLevelId = readRequiredNumber(item, "bloomLevelId");
  const name = readRequiredString(item, "name");
  const rank = readRequiredNumber(item, "rank");
  if (bloomLevelId === undefined || name === undefined || rank === undefined) {
    return undefined;
  }
  return { bloomLevelId, name, rank };
}

function parseDifficultyLevel(item: unknown): DifficultyLevelLookup | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }
  const difficultyLevelId = readRequiredNumber(item, "difficultyLevelId");
  const name = readRequiredString(item, "name");
  const rank = readRequiredNumber(item, "rank");
  if (
    difficultyLevelId === undefined ||
    name === undefined ||
    rank === undefined
  ) {
    return undefined;
  }
  return { difficultyLevelId, name, rank };
}

function parseQuestionFormat(item: unknown): QuestionFormatLookup | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }
  const questionFormatId = readRequiredNumber(item, "questionFormatId");
  const formatCode = readRequiredString(item, "formatCode");
  if (questionFormatId === undefined || formatCode === undefined) {
    return undefined;
  }
  return { questionFormatId, formatCode };
}

async function fetchLookupItems<T>(
  path: string,
  parseItem: (item: unknown) => T | undefined,
  fallback: string,
): Promise<T[]> {
  const response = await fetchElovateApi(path);
  const responseBody: unknown = await response.json();
  if (response.ok === false) {
    throw new ElovateApiError(
      response.status,
      readErrorMessage(responseBody, fallback),
    );
  }
  if (isPlainObject(responseBody) === false) {
    throw new Error(`${fallback} Response was invalid.`);
  }
  const items = readObjectList(responseBody, "items");
  const parsed: T[] = [];
  for (const item of items) {
    const value = parseItem(item);
    if (value !== undefined) {
      parsed.push(value);
    }
  }
  return parsed;
}

export async function listBloomLevels(): Promise<BloomLevelLookup[]> {
  return fetchLookupItems(
    "/lookups/bloom-levels",
    parseBloomLevel,
    "Could not load bloom levels.",
  );
}

export async function listDifficultyLevels(): Promise<DifficultyLevelLookup[]> {
  return fetchLookupItems(
    "/lookups/difficulty-levels",
    parseDifficultyLevel,
    "Could not load difficulty levels.",
  );
}

export async function listQuestionFormats(): Promise<QuestionFormatLookup[]> {
  return fetchLookupItems(
    "/lookups/question-formats",
    parseQuestionFormat,
    "Could not load question formats.",
  );
}
