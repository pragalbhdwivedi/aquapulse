import type { DateRange, FilterOption, PaginationParams, SortOption } from "@aquapulse/types";

export interface RepositoryListQuery extends PaginationParams {
  readonly search?: string;
  readonly sort?: SortOption[];
  readonly filters?: FilterOption[];
  readonly dateRange?: DateRange;
}

export interface RepositoryLookup {
  readonly id: string;
}

export interface ForeignKeyLookup {
  readonly resourceType: string;
  readonly resourceId: string;
}
