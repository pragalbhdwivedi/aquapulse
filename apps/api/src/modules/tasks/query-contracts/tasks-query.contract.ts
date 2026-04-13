import type { FilterOption, PaginationParams, SortOption, TaskStatus } from "@aquapulse/types";

export interface TasksListQueryContract extends PaginationParams {
  readonly assigneeId?: string;
  readonly pondId?: string;
  readonly status?: TaskStatus;
  readonly search?: string;
  readonly sort?: SortOption[];
  readonly filters?: FilterOption[];
}
