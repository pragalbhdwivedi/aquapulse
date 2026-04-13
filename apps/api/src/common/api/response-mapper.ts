import type { ApiErrorEnvelope, ApiSuccessEnvelope, ListResponse, PageMeta } from "@aquapulse/types";
import type { RequestMetadata } from "../request-metadata.interface";

export function createResponseMeta(
  requestMetadata?: RequestMetadata,
  meta?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!requestMetadata && !meta) {
    return undefined;
  }

  return {
    ...(requestMetadata ? { request: requestMetadata } : {}),
    ...meta
  };
}

export function createSuccessResponse<TData>(
  data: TData,
  meta?: Record<string, unknown>
): ApiSuccessEnvelope<TData> {
  return { ok: true, data, meta };
}

export function createItemResponse<TItem>(item: TItem): ApiSuccessEnvelope<TItem> {
  return createSuccessResponse(item);
}

export function createDetailResponse<TItem>(item: TItem): ApiSuccessEnvelope<TItem> {
  return createItemResponse(item);
}

export function createListResponse<TItem>(
  items: TItem[],
  page: PageMeta
): ApiSuccessEnvelope<ListResponse<TItem>> {
  return createSuccessResponse({ items, page });
}

export function createEmptyResponse(message = "No results available"): ApiSuccessEnvelope<{ message: string }> {
  return createSuccessResponse({ message });
}

export function createEmptyStateResponse(message = "No results available") {
  return createEmptyResponse(message);
}

export function createValidationErrorResponse(
  details?: Record<string, unknown>
): ApiErrorEnvelope {
  return { ok: false, error: { code: "VALIDATION_ERROR", message: "Validation failed.", details } };
}

export function createValidationFailureResponse(
  details?: Record<string, unknown>
): ApiErrorEnvelope {
  return createValidationErrorResponse(details);
}

export function createNotFoundResponse(resource = "Resource"): ApiErrorEnvelope {
  return { ok: false, error: { code: "NOT_FOUND", message: `${resource} was not found.` } };
}

export function createNotFoundPlaceholderResponse(resource = "Resource"): ApiErrorEnvelope {
  return createNotFoundResponse(resource);
}

export function createUnauthorizedResponse(): ApiErrorEnvelope {
  return { ok: false, error: { code: "UNAUTHORIZED", message: "Authentication is required." } };
}

export function createUnauthorizedPlaceholderResponse(): ApiErrorEnvelope {
  return createUnauthorizedResponse();
}

export function createForbiddenResponse(): ApiErrorEnvelope {
  return { ok: false, error: { code: "FORBIDDEN", message: "You do not have access to this resource." } };
}

export function createForbiddenPlaceholderResponse(): ApiErrorEnvelope {
  return createForbiddenResponse();
}
