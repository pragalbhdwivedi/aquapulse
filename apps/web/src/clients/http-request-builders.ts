import type { EndpointContract, ListQueryRequest } from "@aquapulse/types";
import type { HttpQueryValue } from "./fetch-executor";
import type { EndpointInvocationConfig } from "./invocation-registry";

function normalizeQueryValue(value: unknown): HttpQueryValue {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return value == null ? value : JSON.stringify(value);
}

export function buildRoutePath(
  template: string,
  params: Record<string, unknown>
): string {
  return template.replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : key;
  });
}

export function serializeQueryParams(
  query?: Record<string, HttpQueryValue>
): string {
  if (!query) {
    return "";
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  return searchParams.toString();
}

export function normalizeRequestBody<TBody>(body: TBody | undefined): TBody | undefined {
  return body === undefined ? undefined : body;
}

export function normalizeListQueryToHttpParams<TQuery extends Partial<ListQueryRequest>>(
  query?: TQuery
): Record<string, HttpQueryValue> | undefined {
  if (!query) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(query).map(([key, value]) => [key, normalizeQueryValue(value)])
  );
}

export function buildHttpRequestFromInvocation<
  TEndpoint extends EndpointContract<unknown, unknown>
>(
  invocation: EndpointInvocationConfig<TEndpoint>,
  request: unknown,
  headers?: Record<string, string>
) {
  const adaptedRequest = invocation.adaptRequest(request as never);
  const requestObject =
    request && typeof request === "object" ? (request as Record<string, unknown>) : {};

  return {
    endpointId: invocation.endpointId,
    method: invocation.method,
    path: buildRoutePath(invocation.path, requestObject),
    query: adaptedRequest.query ?? normalizeListQueryToHttpParams(requestObject),
    body: normalizeRequestBody(adaptedRequest.body),
    headers
  };
}
