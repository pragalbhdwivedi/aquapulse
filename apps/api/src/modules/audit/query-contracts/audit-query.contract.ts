import type { DateRange, FilterOption, PaginationParams, SortOption } from "@aquapulse/types";

export interface AuditListQueryContract extends PaginationParams {
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly action?: "create" | "update" | "delete" | "view" | "export";
  readonly dateRange?: DateRange;
  readonly sort?: SortOption[];
  readonly filters?: FilterOption[];
}
