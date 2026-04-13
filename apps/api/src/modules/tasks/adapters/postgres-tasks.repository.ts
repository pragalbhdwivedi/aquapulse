import { Injectable } from "@nestjs/common";
import type { ListResponse, TaskSummary } from "@aquapulse/types";
import type { CreateTasksDto, UpdateTasksDto } from "../dto";
import type { TasksRepositoryPort } from "../ports/tasks-repository.port";
import type { TasksListQueryContract } from "../query-contracts/tasks-query.contract";

interface TaskRow {
  readonly id: string;
  readonly title: string;
  readonly status: "todo" | "in_progress" | "done" | "cancelled";
  readonly assignee_id?: string;
  readonly pond_id?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

function mapTaskRowToDomain(row: TaskRow): TaskSummary {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    assigneeId: row.assignee_id,
    pondId: row.pond_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createPlaceholderTaskRow(): TaskRow {
  return {
    id: "task-1",
    title: "Inspect aeration equipment",
    status: "todo",
    assignee_id: "user-1",
    pond_id: "pond-1",
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z"
  };
}

@Injectable()
export class PostgresTasksRepository implements TasksRepositoryPort {
  async create(_input: CreateTasksDto): Promise<TaskSummary> {
    return mapTaskRowToDomain(createPlaceholderTaskRow());
  }

  async update(_id: string, _input: UpdateTasksDto): Promise<TaskSummary> {
    return mapTaskRowToDomain(createPlaceholderTaskRow());
  }

  async getById(_id: string): Promise<TaskSummary> {
    return mapTaskRowToDomain(createPlaceholderTaskRow());
  }

  async list(_query: TasksListQueryContract): Promise<ListResponse<TaskSummary>> {
    return {
      items: [mapTaskRowToDomain(createPlaceholderTaskRow())],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
  }
}
