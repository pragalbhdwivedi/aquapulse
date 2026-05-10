import type { TasksListQueryRequest } from "@aquapulse/types";

export interface TasksListQueryContract extends TasksListQueryRequest {
  readonly taskId?: string;
}
