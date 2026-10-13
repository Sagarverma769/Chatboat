export function getBackendApiUrl(path: string) {
  const configuredBase = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;
  // Always default to 127.0.0.1:8000/api/v1 so it works even without .env.local on VMs
  const base = configuredBase || "http://127.0.0.1:8000/api/v1";
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function backendRequest(request: Request, path: string, payload?: unknown): Promise<Response> {
  const url = getBackendApiUrl(path);

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

  // Try primary URL first, with fallback to alternate loopback (127.0.0.1 <-> localhost)
  const candidateUrls = [url];
  if (url.includes("127.0.0.1")) {
    candidateUrls.push(url.replace("127.0.0.1", "localhost"));
  } else if (url.includes("localhost")) {
    candidateUrls.push(url.replace("localhost", "127.0.0.1"));
  }

  let lastError: unknown = null;
  for (const targetUrl of candidateUrls) {
    try {
      const upstream = await fetch(targetUrl, {
        method: request.method,
        headers,
        body,
        cache: "no-store",
      });
      const responseBody = upstream.status === 204 ? null : await upstream.text();
      if (upstream.status >= 400) {
        try {
          JSON.parse(responseBody ?? "");
        } catch {
          console.error(
            `[backend-api] Backend returned a non-JSON error response (HTTP ${upstream.status}) from ${targetUrl}.`,
          );
          return Response.json(
            { detail: `Backend API returned an unreadable error response (HTTP ${upstream.status}).` },
            { status: upstream.status },
          );
        }
      }
      return new Response(responseBody, {
        status: upstream.status,
        headers: {
          "Content-Type": upstream.headers.get("content-type") || "application/json",
        },
      });
    } catch (err) {
      lastError = err;
      // Continue to next candidate URL
    }
  }

  console.error(`[backend-api] Failed to connect to backend at ${candidateUrls.join(" or ")}:`, lastError);
  return Response.json({
    detail: "Backend API server is not running or unreachable on port 8000. Please start the Python backend (uvicorn main:app --host 0.0.0.0 --port 8000)."
  }, { status: 503 });
}