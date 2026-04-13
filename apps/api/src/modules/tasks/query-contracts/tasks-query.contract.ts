import type { RepositoryListQuery } from "@aquapulse/database";
import type { TaskStatus } from "@aquapulse/types";

export interface TasksListQueryContract extends RepositoryListQuery {
  readonly assigneeId?: string;
  readonly pondId?: string;
  readonly status?: TaskStatus;
}
