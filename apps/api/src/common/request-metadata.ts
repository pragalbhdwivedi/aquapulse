import type { RequestMetadata } from "./request-metadata.interface";

export interface RequestLike {
  readonly id?: string;
  readonly headers?: Record<string, string | string[] | undefined>;
  readonly user?: { id?: string } | null;
}

function getHeaderValue(
  headers: RequestLike["headers"],
  key: string
): string | undefined {
  const value = headers?.[key] ?? headers?.[key.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function extractRequestMetadata(request?: RequestLike): RequestMetadata {
  return {
    requestId: request?.id ?? getHeaderValue(request?.headers, "x-request-id"),
    correlationId: getHeaderValue(request?.headers, "x-correlation-id"),
    actorId: request?.user?.id
  };
}
