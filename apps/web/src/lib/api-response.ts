import type { ApiSuccessEnvelope, ListResponse, PageMeta } from "@aquapulse/types";
import type { RepositoryListQuery } from "@aquapulse/database";

export function ok<TData>(data: TData): ApiSuccessEnvelope<TData> {
  return { ok: true, data };
}

export function list<TItem>(items: TItem[], query?: Pick<RepositoryListQuery, "page" | "pageSize">): ListResponse<TItem> {
  const pageNumber = query?.page ?? 1;
  const pageSize = query?.pageSize ?? 20;
  const page: PageMeta = {
    page: pageNumber,
    pageSize,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize))
  };
  return { items, page };
}
