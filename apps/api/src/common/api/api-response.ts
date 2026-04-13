import type { ApiErrorEnvelope, ApiSuccessEnvelope } from "@aquapulse/types";

export type ApiSuccessResponse<TData> = ApiSuccessEnvelope<TData>;
export type ApiErrorResponse = ApiErrorEnvelope;

export function createApiSuccessResponse<TData>(
  data: TData,
  meta?: Record<string, unknown>
): ApiSuccessResponse<TData> {
  return {
    ok: true,
    data,
    meta,
  };
}

export function createApiErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiErrorResponse {
  return {
    ok: false,
    error: {
      code,
      message,
      details,
    },
  };
}
