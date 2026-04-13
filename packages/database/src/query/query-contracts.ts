import type { DateRange, FilterOption, PaginationParams, SortOption } from "@aquapulse/types";

export interface RepositoryListQuery extends PaginationParams {
  readonly search?: string;
  readonly sort?: SortOption[];
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
