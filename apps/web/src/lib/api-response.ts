import type { ApiSuccessEnvelope, ListResponse, PageMeta } from "@aquapulse/types";

export function ok<TData>(data: TData): ApiSuccessEnvelope<TData> {
  return { ok: true, data };
}

export function list<TItem>(items: TItem[]): ListResponse<TItem> {
  const page: PageMeta = { page: 1, pageSize: 20, totalItems: items.length, totalPages: 1 };
  return { items, page };
}
