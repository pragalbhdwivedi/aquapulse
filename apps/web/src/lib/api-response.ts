import type { ApiSuccessEnvelope, ListResponse, PageMeta } from "@aquapulse/types";
import type { RepositoryListQuery } from "@aquapulse/database";
import { normalizeListQuery } from "../contracts/api";

export function ok<TData>(data: TData): ApiSuccessEnvelope<TData> {
  return { ok: true, data };
}

export function list<TItem>(items: TItem[], query?: Pick<RepositoryListQuery, "page" | "pageSize">): ListResponse<TItem> {
  const normalizedQuery = normalizeListQuery(query);
  const pageNumber = normalizedQuery.page;
  const pageSize = normalizedQuery.pageSize;
  const page: PageMeta = {
    page: pageNumber,
    pageSize,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize))
  };
  return { items, page };
}
