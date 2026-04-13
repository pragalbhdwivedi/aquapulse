import type { ApiSuccessEnvelope, ListResponse, PageMeta } from "@aquapulse/types";

const defaultPageMeta: PageMeta = {
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 1,
};

export function ok<TData>(data: TData): ApiSuccessEnvelope<TData> {
  return {
    ok: true,
    data,
  };
}

export function list<TItem>(items: TItem[]): ListResponse<TItem> {
  return {
    items,
    page: {
      ...defaultPageMeta,
      totalItems: items.length,
    },
  };
}
