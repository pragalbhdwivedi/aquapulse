import type { DateRange, FilterOption, PaginationParams, SortDirection, SortOption } from "@aquapulse/types";

export interface RepositoryListQuery extends PaginationParams {
  readonly search?: string;
  readonly sort?: SortOption[];
  readonly filters?: FilterOption[];
  readonly dateRange?: DateRange;
}

export interface RepositoryListQueryInput extends PaginationParams {
  readonly search?: string;
  readonly sort?: SortOption[];
  readonly sortField?: string;
  readonly sortDirection?: SortDirection;
  readonly filters?: FilterOption[];
  readonly dateRange?: DateRange;
}

export interface CompiledQueryPlan {
  readonly key: string;
  readonly statement: string;
  readonly params: readonly unknown[];
  readonly pagination?: PaginationParams;
  readonly filters?: Readonly<Record<string, unknown>>;
  readonly sort?: readonly SortOption[];
}

export interface RepositoryLookup {
  readonly id: string;
}

export interface ForeignKeyLookup {
  readonly resourceType: string;
  readonly resourceId: string;
}

export function normalizeRepositoryListQuery(
  input: RepositoryListQueryInput
): RepositoryListQuery {
  return {
    page: input.page,
    pageSize: input.pageSize,
    search: input.search,
    sort:
      input.sort && input.sort.length > 0
        ? [...input.sort]
        : input.sortField
          ? [{ field: input.sortField, direction: input.sortDirection ?? "asc" }]
          : undefined,
    filters: input.filters,
    dateRange: input.dateRange
  };
}
