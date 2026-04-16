import type { ApiErrorEnvelope, ApiSuccessEnvelope, ListResponse } from "@aquapulse/types";

export type ApiSuccessResponse<TData> = ApiSuccessEnvelope<TData>;
export type ApiErrorResponse = ApiErrorEnvelope;
export type ApiItemResponse<TItem> = ApiSuccessEnvelope<TItem>;
export type ApiListResponse<TItem> = ApiSuccessEnvelope<ListResponse<TItem>>;
