import type { AlertSeverity, FilterOption, PaginationParams, SortOption } from "@aquapulse/types";

export interface AlertsListQueryContract extends PaginationParams {
  readonly pondId?: string;
  readonly severity?: AlertSeverity;
  readonly status?: "open" | "acknowledged" | "resolved";
  readonly source?: string;
  readonly sort?: SortOption[];
  readonly filters?: FilterOption[];
}
