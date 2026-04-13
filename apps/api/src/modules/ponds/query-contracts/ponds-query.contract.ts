import type { FilterOption, PaginationParams, SortOption } from "@aquapulse/types";

export interface PondListQueryContract extends PaginationParams {
  readonly farmId?: string;
  readonly status?: "active" | "maintenance" | "inactive";
  readonly kind?: "pond" | "tank" | "cage";
  readonly search?: string;
  readonly sort?: SortOption[];
  readonly filters?: FilterOption[];
}
