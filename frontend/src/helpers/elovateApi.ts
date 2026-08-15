export async function getAccessToken(): Promise<string | undefined> {
  const tokenResponse = await fetch("/api/auth/token");
  if (tokenResponse.ok === false) {
    return undefined;
  }

  const tokenBody = await tokenResponse.json();
  if (
    typeof tokenBody !== "object" ||
    tokenBody === null ||
    Array.isArray(tokenBody)
  ) {
    return undefined;
  }

  if ("token" in tokenBody === false) {
    return undefined;
  }

  const token = tokenBody.token;
  if (typeof token !== "string" || token === "") {
    return undefined;
  }

  return token;
}

export async function fetchElovateApi(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const accessToken = await getAccessToken();
  if (accessToken === undefined) {
    throw new Error("Missing access token");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (headers.has("Accept") === false) {
    headers.set("Accept", "application/json");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return fetch(`/elovate-api${normalizedPath}`, {
    ...init,
    headers,
  });
}
