import { auth, jwksReady } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth);

function publicAuthErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message !== "") {
    return error.message.replace(/postgresql:\/\/\S+/gi, "postgresql://***");
  }
  return "Authentication request failed.";
}

async function handleAuth(
  method: "GET" | "POST",
  request: Request,
): Promise<Response> {
  try {
    await jwksReady;
    return await handlers[method](request);
  } catch (error) {
    console.error("[auth]", method, new URL(request.url).pathname, error);
    return Response.json(
      { message: publicAuthErrorMessage(error) },
      { status: 500 },
    );
  }
}

export function GET(request: Request): Promise<Response> {
  return handleAuth("GET", request);
}

export function POST(request: Request): Promise<Response> {
  return handleAuth("POST", request);
}
