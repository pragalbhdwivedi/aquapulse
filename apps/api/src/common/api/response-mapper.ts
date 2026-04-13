import type { ApiErrorEnvelope, ApiSuccessEnvelope, ListResponse, PageMeta } from "@aquapulse/types";

export function createSuccessResponse<TData>(
  data: TData,
  meta?: Record<string, unknown>
): ApiSuccessEnvelope<TData> {
  return { ok: true, data, meta };
}

export function createItemResponse<TItem>(item: TItem): ApiSuccessEnvelope<TItem> {
  return createSuccessResponse(item);
}

export function createListResponse<TItem>(
  items: TItem[],
  page: PageMeta
): ApiSuccessEnvelope<ListResponse<TItem>> {
  return createSuccessResponse({ items, page });
}

export function createEmptyStateResponse(message = "No results available") {
  return createSuccessResponse({ message });
}

export function createValidationErrorResponse(
  details?: Record<string, unknown>
): ApiErrorEnvelope {
  return { ok: false, error: { code: "VALIDATION_ERROR", message: "Validation failed.", details } };
}

export function createNotFoundResponse(resource = "Resource"): ApiErrorEnvelope {
  return { ok: false, error: { code: "NOT_FOUND", message: `${resource} was not found.` } };
}

export function createUnauthorizedResponse(): ApiErrorEnvelope {
  return { ok: false, error: { code: "UNAUTHORIZED", message: "Authentication is required." } };
}

export function createForbiddenResponse(): ApiErrorEnvelope {
  return { ok: false, error: { code: "FORBIDDEN", message: "You do not have access to this resource." } };
}
