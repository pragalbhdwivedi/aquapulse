import type { FetchExecutor, HttpExecutorRequest, HttpExecutorResponse } from "./fetch-executor";
import { serializeQueryParams } from "./http-request-builders";

export interface FetchHttpExecutorOptions {
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
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
    const response = await fetchImpl(buildRequestUrl(request, options.baseUrl), {
      method: request.method,
      headers: {
        "content-type": "application/json",
        ...(request.headers ?? {})
      },
      body: request.method === "GET" ? undefined : request.body === undefined ? undefined : JSON.stringify(request.body)
    });

    const body = (await response.json()) as TBody;

    return {
      status: response.status,
      body
    };
  };
}
