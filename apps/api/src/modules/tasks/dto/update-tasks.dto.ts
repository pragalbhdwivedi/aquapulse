import type { TaskUpdateRequest } from "@aquapulse/types";

export class UpdateTasksDto implements TaskUpdateRequest {
  title?: string;
  status?: "todo" | "in_progress" | "done" | "cancelled";
  assigneeId?: string;
  pondId?: string;
}
