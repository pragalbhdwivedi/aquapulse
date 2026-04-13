import type { ApiErrorEnvelope, ApiSuccessEnvelope } from "@aquapulse/types";

export type ApiSuccessResponse<TData> = ApiSuccessEnvelope<TData>;
export type ApiErrorResponse = ApiErrorEnvelope;
