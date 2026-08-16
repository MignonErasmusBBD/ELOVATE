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

let bloomLevelsCache: BloomLevelLookup[] | undefined;
let bloomLevelsInFlight: Promise<BloomLevelLookup[]> | undefined;
let difficultyLevelsCache: DifficultyLevelLookup[] | undefined;
let difficultyLevelsInFlight: Promise<DifficultyLevelLookup[]> | undefined;
let questionFormatsCache: QuestionFormatLookup[] | undefined;
let questionFormatsInFlight: Promise<QuestionFormatLookup[]> | undefined;

async function cachedLookup<T>(
  cached: T[] | undefined,
  inFlight: Promise<T[]> | undefined,
  load: () => Promise<T[]>,
  remember: (items: T[]) => void,
  rememberInFlight: (request: Promise<T[]> | undefined) => void,
): Promise<T[]> {
  if (cached !== undefined) {
    return cached;
  }
  if (inFlight !== undefined) {
    return inFlight;
  }
  const request = load()
    .then((items) => {
      remember(items);
      return items;
    })
    .finally(() => {
      rememberInFlight(undefined);
    });
  rememberInFlight(request);
  return request;
}

export async function listBloomLevels(): Promise<BloomLevelLookup[]> {
  return cachedLookup(
    bloomLevelsCache,
    bloomLevelsInFlight,
    () =>
      fetchLookupItems(
        "/lookups/bloom-levels",
        parseBloomLevel,
        "Could not load bloom levels.",
      ),
    (items) => {
      bloomLevelsCache = items;
    },
    (request) => {
      bloomLevelsInFlight = request;
    },
  );
}

export async function listDifficultyLevels(): Promise<DifficultyLevelLookup[]> {
  return cachedLookup(
    difficultyLevelsCache,
    difficultyLevelsInFlight,
    () =>
      fetchLookupItems(
        "/lookups/difficulty-levels",
        parseDifficultyLevel,
        "Could not load difficulty levels.",
      ),
    (items) => {
      difficultyLevelsCache = items;
    },
    (request) => {
      difficultyLevelsInFlight = request;
    },
  );
}

export async function listQuestionFormats(): Promise<QuestionFormatLookup[]> {
  return cachedLookup(
    questionFormatsCache,
    questionFormatsInFlight,
    () =>
      fetchLookupItems(
        "/lookups/question-formats",
        parseQuestionFormat,
        "Could not load question formats.",
      ),
    (items) => {
      questionFormatsCache = items;
    },
    (request) => {
      questionFormatsInFlight = request;
    },
  );
}
