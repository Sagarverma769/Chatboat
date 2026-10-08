export function getBackendApiUrl(path: string) {
  const configuredBase = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;
  const base = configuredBase || (process.env.NODE_ENV === "development" ? "http://localhost:8000/api/v1" : "");
  if (!base) {
    return null;
  }
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function backendRequest(request: Request, path: string, payload?: unknown): Promise<Response> {
  const url = getBackendApiUrl(path);
  if (!url) {
    return Response.json({ detail: "Backend API URL is not configured." }, { status: 503 });
  }

  const headers = new Headers({ Accept: "application/json" });
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  let body: string | undefined;
  if (payload !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(payload);
  } else if (request.method !== "GET" && request.method !== "DELETE") {
    body = await request.text();
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
  }

  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
    const responseBody = upstream.status === 204 ? null : await upstream.text();
    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return Response.json({ detail: "Backend API is unavailable." }, { status: 503 });
  }
}