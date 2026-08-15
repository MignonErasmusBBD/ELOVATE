import { isPlainObject, readErrorMessage, readRequiredString } from "./jsonFields";

export class ElovateApiError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ElovateApiError";
    this.statusCode = statusCode;
  }
}

export function errorMessageFromUnknown(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof ElovateApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message !== "") {
    return error.message;
  }
  return fallback;
}

const ACCESS_TOKEN_CACHE_MS = 10 * 60 * 1000;

let cachedAccessToken: string | undefined;
let cachedAccessTokenExpiresAt = 0;
let accessTokenInFlight: Promise<string | undefined> | undefined;

function clearAccessTokenCache() {
  cachedAccessToken = undefined;
  cachedAccessTokenExpiresAt = 0;
}

async function fetchAccessToken(): Promise<string | undefined> {
  const tokenResponse = await fetch("/api/auth/token");
  if (tokenResponse.ok === false) {
    clearAccessTokenCache();
    return undefined;
  }
  const tokenBody: unknown = await tokenResponse.json();
  if (isPlainObject(tokenBody) === false) {
    return undefined;
  }
  const accessToken = readRequiredString(tokenBody, "token");
  if (accessToken === undefined) {
    return undefined;
  }
  cachedAccessToken = accessToken;
  cachedAccessTokenExpiresAt = Date.now() + ACCESS_TOKEN_CACHE_MS;
  return accessToken;
}

async function readAccessToken(): Promise<string | undefined> {
  if (
    cachedAccessToken !== undefined &&
    Date.now() < cachedAccessTokenExpiresAt
  ) {
    return cachedAccessToken;
  }
  if (accessTokenInFlight !== undefined) {
    return accessTokenInFlight;
  }
  accessTokenInFlight = fetchAccessToken().finally(() => {
    accessTokenInFlight = undefined;
  });
  return accessTokenInFlight;
}

export async function ensureAccessToken(): Promise<string | undefined> {
  return readAccessToken();
}

async function sendElovateRequest(
  path: string,
  init: RequestInit | undefined,
  accessToken: string,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (init?.body !== undefined && headers.has("Content-Type") === false) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`/elovate-api${path}`, {
    ...init,
    headers,
  });
}

export async function elovateApiJson(
  path: string,
  init?: RequestInit,
): Promise<unknown> {
  let accessToken = await readAccessToken();
  if (accessToken === undefined) {
    throw new ElovateApiError(401, "Not signed in.");
  }

  let response = await sendElovateRequest(path, init, accessToken);
  if (response.status === 401) {
    clearAccessTokenCache();
    accessToken = await readAccessToken();
    if (accessToken === undefined) {
      throw new ElovateApiError(401, "Not signed in.");
    }
    response = await sendElovateRequest(path, init, accessToken);
  }

  if (response.ok === false) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = undefined;
    }
    throw new ElovateApiError(
      response.status,
      readErrorMessage(errorBody, "Request failed."),
    );
  }

  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? undefined;
  if (
    contentType === undefined ||
    contentType.includes("application/json") === false
  ) {
    return undefined;
  }

  return response.json();
}
