import type {
  EndpointContract,
  EndpointRequest,
  EndpointResponse
} from "@aquapulse/types";
import type {
  HttpExecutorRequest,
  HttpExecutorResponse,
  HttpQueryValue
} from "./fetch-executor";

export interface PlaceholderHttpRequest<TEndpoint extends EndpointContract<unknown, unknown>>
  extends HttpExecutorRequest {
  readonly endpointId: TEndpoint["id"];
  readonly method: TEndpoint["method"];
  readonly path: string;
  readonly body?: unknown;
  readonly query?: Record<string, HttpQueryValue>;
}

export interface PlaceholderHttpResponse<TResponse> extends HttpExecutorResponse<TResponse> {}

function interpolatePath(
  template: string,
  request: Record<string, unknown>
): string {
  return template.replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = request[key];
    return typeof value === "string" ? value : key;
  });
}

export function adaptEndpointRequestToHttp<TEndpoint extends EndpointContract<unknown, unknown>>(
  endpoint: TEndpoint,
  request: EndpointRequest<TEndpoint>
): PlaceholderHttpRequest<TEndpoint> {
  const requestObject =
    request && typeof request === "object" ? (request as Record<string, unknown>) : {};
  const normalizedQuery = Object.fromEntries(
    Object.entries(requestObject).map(([key, value]) => {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value == null
      ) {
        return [key, value];
      }

      return [key, JSON.stringify(value)];
    })
  ) as Record<string, HttpQueryValue>;
  const path = interpolatePath(endpoint.path, requestObject);
  const isGet = endpoint.method === "GET";

  return {
    endpointId: endpoint.id,
    method: endpoint.method,
    path,
    query: isGet ? normalizedQuery : undefined,
    body: isGet ? undefined : request
  };
}

export function adaptHttpResponseToEndpoint<TEndpoint extends EndpointContract<unknown, unknown>>(
  _endpoint: TEndpoint,
  response: PlaceholderHttpResponse<EndpointResponse<TEndpoint>>
): EndpointResponse<TEndpoint> {
  return response.body;
}

export function createPlaceholderHttpResponse<TResponse>(
  body: TResponse,
  status = 200
): PlaceholderHttpResponse<TResponse> {
  return { status, body };
}
