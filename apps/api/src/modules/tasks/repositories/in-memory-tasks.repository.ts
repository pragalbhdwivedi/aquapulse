import { Injectable } from "@nestjs/common";
import type { ListResponse, TaskSummary } from "@aquapulse/types";
import type { CreateTasksDto, UpdateTasksDto } from "../dto";
import type { TasksRepositoryPort } from "../ports/tasks-repository.port";
import type { TasksListQueryContract } from "../query-contracts/tasks-query.contract";

const task: TaskSummary = {
  id: "task-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  title: "Inspect aeration equipment",
  status: "todo",
  assigneeId: "user-1",
  pondId: "pond-1"
};

@Injectable()
export class InMemoryTasksRepository implements TasksRepositoryPort {
  async create(_input: CreateTasksDto): Promise<TaskSummary> {
    return task;
  }

  async update(_id: string, _input: UpdateTasksDto): Promise<TaskSummary> {
    return task;
  }

  async getById(_id: string): Promise<TaskSummary> {
    return task;
  }

  async list(_query: TasksListQueryContract): Promise<ListResponse<TaskSummary>> {
    return { items: [task], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }
}
