import type {
  EndpointContract,
  EndpointRequest,
  EndpointResponse
} from "@aquapulse/types";

export interface PlaceholderHttpRequest<TEndpoint extends EndpointContract<unknown, unknown>> {
  readonly endpointId: TEndpoint["id"];
  readonly method: TEndpoint["method"];
  readonly path: string;
  readonly body?: unknown;
  readonly query?: Record<string, unknown>;
}

export interface PlaceholderHttpResponse<TResponse> {
  readonly status: number;
  readonly body: TResponse;
}

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
  const path = interpolatePath(endpoint.path, requestObject);
  const isGet = endpoint.method === "GET";

  return {
    endpointId: endpoint.id,
    method: endpoint.method,
    path,
    query: isGet ? requestObject : undefined,
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
