import type { ListResponse, TaskSummary } from "@aquapulse/types";
import type { CreateTasksDto, UpdateTasksDto } from "../dto";
import type { TasksListQueryContract } from "../query-contracts/tasks-query.contract";

export const TASKS_REPOSITORY = Symbol("TASKS_REPOSITORY");

export interface TasksRepositoryPort {
  create(input: CreateTasksDto): Promise<TaskSummary>;
  update(id: string, input: UpdateTasksDto): Promise<TaskSummary>;
  getById(id: string): Promise<TaskSummary>;
  list(query: TasksListQueryContract): Promise<ListResponse<TaskSummary>>;
}
