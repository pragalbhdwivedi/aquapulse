import type { FetchExecutor, HttpExecutorRequest, HttpExecutorResponse } from "./fetch-executor";
import { serializeQueryParams } from "./http-request-builders";

export interface FetchHttpExecutorOptions {
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
}

function parseResponseBody<TBody>(rawBody: string): TBody | undefined {
  if (!rawBody) {
    return undefined;
  }

  try {
    return JSON.parse(rawBody) as TBody;
  } catch {
    return undefined;
  }
}

async function readResponseBody<TBody>(response: Response): Promise<TBody | undefined> {
  if (typeof response.text === "function") {
    return parseResponseBody<TBody>(await response.text());
  }

  if (typeof response.json === "function") {
    return (await response.json()) as TBody;
  }

  return undefined;
}

function buildRequestUrl(request: HttpExecutorRequest, baseUrl?: string): string {
  const query = request.query ? serializeQueryParams(request.query) : "";
  const base = baseUrl ? baseUrl.replace(/\/+$/, "") : "";
  const path = request.path.startsWith("/") ? request.path : `/${request.path}`;
  return `${base}${path}${query ? `?${query}` : ""}`;
}

export function createFetchHttpExecutor(
  options: FetchHttpExecutorOptions = {}
): FetchExecutor {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  if (!fetchImpl) {
    throw new Error("Fetch is not available for HTTP client execution.");
  }

  return async function execute<TBody = unknown>(
    request: HttpExecutorRequest
  ): Promise<HttpExecutorResponse<TBody>> {
    const requestUrl = buildRequestUrl(request, options.baseUrl);
    const response = await fetchImpl(requestUrl, {
      method: request.method,
      headers: {
        "content-type": "application/json",
        ...(request.headers ?? {})
      },
      body: request.method === "GET" ? undefined : request.body === undefined ? undefined : JSON.stringify(request.body)
    });
    const body = await readResponseBody<TBody>(response);
    const responseOk =
      typeof response.ok === "boolean"
        ? response.ok
        : response.status >= 200 && response.status < 300;

    if (!responseOk) {
      const message =
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof (body as { error?: { message?: unknown } }).error?.message === "string"
          ? (body as { error: { message: string } }).error.message
          : `HTTP ${response.status} request failed for ${requestUrl}.`;
      throw new Error(message);
    }

    return {
      status: response.status,
      body: body as TBody
    };
  };
}
