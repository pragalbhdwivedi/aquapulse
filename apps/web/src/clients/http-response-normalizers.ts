import type { ApiErrorEnvelope, ApiSuccessEnvelope, ListResponse, PageMeta } from "@aquapulse/types";
import type { HttpExecutorResponse } from "./fetch-executor";

export function normalizePageMeta(page: PageMeta): PageMeta {
  return {
    page: page.page,
    pageSize: page.pageSize,
    totalItems: page.totalItems,
    totalPages: Math.max(1, page.totalPages)
  };
}

export function normalizeItemResponse<TItem>(
  response: HttpExecutorResponse<ApiSuccessEnvelope<TItem>>
): ApiSuccessEnvelope<TItem> {
  return response.body;
}

export function normalizeListResponse<TItem>(
  response: HttpExecutorResponse<ApiSuccessEnvelope<ListResponse<TItem>>>
): ApiSuccessEnvelope<ListResponse<TItem>> {
  return {
    ...response.body,
    data: {
      ...response.body.data,
      page: normalizePageMeta(response.body.data.page)
    }
  };
}

export function normalizeEmptyListResponse<TItem>(
  page: Pick<PageMeta, "page" | "pageSize">
): ApiSuccessEnvelope<ListResponse<TItem>> {
  return {
    ok: true,
    data: {
      items: [],
      page: {
        page: page.page,
        pageSize: page.pageSize,
        totalItems: 0,
        totalPages: 1
      }
    }
  };
}

export function normalizeErrorResponse(
  status: number,
  message = "Placeholder request failed."
): ApiErrorEnvelope {
  return {
    ok: false,
    error: {
      code: `HTTP_${status}`,
      message
    }
  };
}
