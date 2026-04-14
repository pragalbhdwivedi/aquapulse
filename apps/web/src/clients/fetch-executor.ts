export type HttpHeaderValue = string;
export type HttpQueryValue = string | number | boolean | null | undefined;

export interface HttpExecutorRequest {
  readonly endpointId: string;
  readonly method: string;
  readonly path: string;
  readonly query?: Record<string, HttpQueryValue>;
  readonly body?: unknown;
  readonly headers?: Record<string, HttpHeaderValue>;
}

export interface HttpExecutorResponse<TBody = unknown> {
  readonly status: number;
  readonly body: TBody;
  readonly headers?: Record<string, HttpHeaderValue>;
}

export type FetchExecutor = <TBody = unknown>(
  request: HttpExecutorRequest
) => Promise<HttpExecutorResponse<TBody>>;
