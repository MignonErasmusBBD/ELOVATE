function stripTrailingSlash(url: string): string {
  if (url.endsWith("/")) {
    return url.slice(0, -1);
  }
  return url;
}

function isUsableHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname !== ""
    );
  } catch {
    return false;
  }
}

function readConfiguredApiUrl(): string | undefined {
  const candidates = [process.env.API_URL, process.env.NEXT_PUBLIC_API_URL];
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === "") {
      continue;
    }
    if (isUsableHttpUrl(candidate)) {
      return stripTrailingSlash(candidate);
    }
    console.error("[elovate-api] Ignoring invalid API URL:", candidate);
  }
  return undefined;
}

/** Nest base including `/api`, resolved at request time (not baked into the Next build). */
export function nestApiBaseUrl(): string | undefined {
  const configured = readConfiguredApiUrl();
  if (configured !== undefined) {
    return configured;
  }
  if (process.env.RAILWAY_ENVIRONMENT !== undefined) {
    return undefined;
  }
  return "http://localhost:3001/api";
}
