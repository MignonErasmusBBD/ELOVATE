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

export type LearningContentType = "text" | "code";

export type LearningContentBlock = {
  id: string;
  contentType: LearningContentType;
  bodyText: string;
  position: number;
};

export type LearningContentSection = {
  id: string;
  courseId: string;
  title: string;
  position: number;
  contentBlocks: LearningContentBlock[];
};

export type LearningContentBlockInput = {
  contentType: LearningContentType;
  bodyText: string;
  position: number;
};

export type CreateLearningContentSectionInput = {
  title: string;
  position?: number;
  contentBlocks?: LearningContentBlockInput[];
};

export type ReplaceLearningContentSectionInput = {
  title: string;
  position: number;
  contentBlocks: LearningContentBlockInput[];
};

function readOptionalNumber(body: object, key: string): number | undefined {
  if (key in body === false) {
    return undefined;
  }
  const field = Reflect.get(body, key);
  if (typeof field !== "number" || Number.isFinite(field) === false) {
    return undefined;
  }
  return field;
}

function readBodyText(body: object, key: string): string | undefined {
  if (key in body === false) {
    return undefined;
  }
  const field = Reflect.get(body, key);
  if (typeof field !== "string") {
    return undefined;
  }
  return field;
}

function parseContentType(value: string | undefined): LearningContentType | undefined {
  if (value === "text" || value === "code") {
    return value;
  }
  return undefined;
}

function parseContentBlock(item: unknown): LearningContentBlock | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }
  const id = readRequiredString(item, "id");
  const contentType = parseContentType(readRequiredString(item, "contentType"));
  const bodyText = readBodyText(item, "bodyText");
  const position = readOptionalNumber(item, "position");
  if (
    id === undefined ||
    contentType === undefined ||
    bodyText === undefined ||
    position === undefined
  ) {
    return undefined;
  }
  return { id, contentType, bodyText, position };
}

export function parseLearningContentSection(
  item: unknown,
): LearningContentSection | undefined {
  if (isPlainObject(item) === false) {
    return undefined;
  }

  const id = readRequiredString(item, "id");
  const courseId = readRequiredString(item, "courseId");
  const title = readRequiredString(item, "title");
  const position = readOptionalNumber(item, "position");
  if (
    id === undefined ||
    courseId === undefined ||
    title === undefined ||
    position === undefined
  ) {
    return undefined;
  }

  const contentBlocks: LearningContentBlock[] = [];
  if ("contentBlocks" in item) {
    const blockItems = Reflect.get(item, "contentBlocks");
    if (Array.isArray(blockItems)) {
      for (const blockItem of blockItems) {
        const block = parseContentBlock(blockItem);
        if (block !== undefined) {
          contentBlocks.push(block);
        }
      }
    }
  }

  return { id, courseId, title, position, contentBlocks };
}

export function parseLearningContentSectionList(
  body: unknown,
): LearningContentSection[] | undefined {
  if (isPlainObject(body) === false) {
    return undefined;
  }
  const items = readObjectList(body, "items");
  const sections: LearningContentSection[] = [];
  for (const item of items) {
    const section = parseLearningContentSection(item);
    if (section !== undefined) {
      sections.push(section);
    }
  }
  return sections;
}

async function readFailedResponse(response: Response, fallback: string): Promise<never> {
  const responseBody: unknown = await response.json().catch(() => undefined);
  throw new ElovateApiError(
    response.status,
    readErrorMessage(responseBody, fallback),
  );
}

export async function listLearningContentSections(
  courseId: string,
): Promise<LearningContentSection[]> {
  const response = await fetchElovateApi(`/courses/${courseId}/sections`);
  const responseBody: unknown = await response.json();
  if (response.ok === false) {
    throw new ElovateApiError(
      response.status,
      readErrorMessage(responseBody, "Could not load learning content."),
    );
  }
  const sections = parseLearningContentSectionList(responseBody);
  if (sections === undefined) {
    throw new Error("Learning content list response was invalid.");
  }
  return sections;
}

export async function createLearningContentSection(
  courseId: string,
  input: CreateLearningContentSectionInput,
): Promise<LearningContentSection> {
  const response = await fetchElovateApi(`/courses/${courseId}/sections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (response.ok === false) {
    await readFailedResponse(response, "Could not create learning section.");
  }
  const responseBody: unknown = await response.json();
  const section = parseLearningContentSection(responseBody);
  if (section === undefined) {
    throw new Error("Create learning section response was invalid.");
  }
  return section;
}

export async function replaceLearningContentSection(
  courseId: string,
  sectionId: string,
  input: ReplaceLearningContentSectionInput,
): Promise<LearningContentSection> {
  const response = await fetchElovateApi(
    `/courses/${courseId}/sections/${sectionId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (response.ok === false) {
    await readFailedResponse(response, "Could not update learning section.");
  }
  const responseBody: unknown = await response.json();
  const section = parseLearningContentSection(responseBody);
  if (section === undefined) {
    throw new Error("Update learning section response was invalid.");
  }
  return section;
}

export async function deleteLearningContentSection(
  courseId: string,
  sectionId: string,
): Promise<void> {
  const response = await fetchElovateApi(
    `/courses/${courseId}/sections/${sectionId}`,
    { method: "DELETE" },
  );
  if (response.ok === false) {
    await readFailedResponse(response, "Could not delete learning section.");
  }
}
