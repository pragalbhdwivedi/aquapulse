import type { ListResponse, TaskSummary } from "@aquapulse/types";
import type { CreateTasksDto, QueryTasksDto, UpdateTasksDto } from "../dto";

export const TASKS_REPOSITORY = Symbol("TASKS_REPOSITORY");

export interface TasksRepositoryPort {
  create(input: CreateTasksDto): Promise<TaskSummary>;
  update(id: string, input: UpdateTasksDto): Promise<TaskSummary>;
  getById(id: string): Promise<TaskSummary>;
  list(query: QueryTasksDto): Promise<ListResponse<TaskSummary>>;
}
