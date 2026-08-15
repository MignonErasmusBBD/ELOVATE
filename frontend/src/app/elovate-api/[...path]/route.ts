import { nestApiBaseUrl } from "@/helpers/nestApiBaseUrl";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const HOP_BY_HOP_HEADERS = new Set([
  "accept-encoding",
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

function copyForwardHeaders(from: Headers): Headers {
  const headers = new Headers();
  from.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      return;
    }
    headers.set(key, value);
  });
  return headers;
}

async function proxyToNest(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const apiBase = nestApiBaseUrl();
  if (apiBase === undefined) {
    return Response.json(
      {
        message:
          "API_URL is missing or invalid on elovate-web. Set it to http://${{elovate-api.RAILWAY_PRIVATE_DOMAIN}}:${{elovate-api.PORT}}/api or https://elovate-api-production.up.railway.app/api",
      },
      { status: 503 },
    );
  }

  const { path } = await context.params;
  const incoming = new URL(request.url);
  const target = new URL(`${apiBase}/${path.join("/")}${incoming.search}`);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const requestBody = hasBody ? await request.arrayBuffer() : undefined;
  let nestResponse: Response;
  try {
    nestResponse = await fetch(target, {
      method: request.method,
      headers: copyForwardHeaders(request.headers),
      body: requestBody,
      redirect: "manual",
    });
  } catch (error) {
    console.error("[elovate-api] Proxy failed", target.href, error);
    return Response.json(
      { message: "Could not reach the Nest API." },
      { status: 502 },
    );
  }

  return new Response(nestResponse.body, {
    status: nestResponse.status,
    statusText: nestResponse.statusText,
    headers: copyForwardHeaders(nestResponse.headers),
  });
}

export function GET(request: Request, context: RouteContext): Promise<Response> {
  return proxyToNest(request, context);
}

export function POST(request: Request, context: RouteContext): Promise<Response> {
  return proxyToNest(request, context);
}

export function PUT(request: Request, context: RouteContext): Promise<Response> {
  return proxyToNest(request, context);
}

export function PATCH(request: Request, context: RouteContext): Promise<Response> {
  return proxyToNest(request, context);
}

export function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return proxyToNest(request, context);
}
