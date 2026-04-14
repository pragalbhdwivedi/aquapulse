import type { TaskCreateRequest } from "@aquapulse/types";

export class CreateTasksDto implements TaskCreateRequest {
  title!: string;
  assigneeId?: string;
  pondId?: string;
}
