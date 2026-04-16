import { Injectable } from "@nestjs/common";
import type { ListResponse, TaskCreateRequest, TaskSummary, TaskUpdateRequest } from "@aquapulse/types";
import type { TasksRepositoryPort } from "../ports/tasks-repository.port";
import type { TasksListQueryContract } from "../query-contracts/tasks-query.contract";

const baseTask: TaskSummary = {
  id: "task-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  title: "Inspect aeration equipment",
  status: "todo",
  assigneeId: "user-1",
  pondId: "pond-1"
};

const taskStore = new WeakMap<InMemoryTasksRepository, TaskSummary[]>();

function getTasks(repository: InMemoryTasksRepository): TaskSummary[] {
  return taskStore.get(repository) ?? [baseTask];
}

function createPage(items: TaskSummary[], page = 1, pageSize = 20): ListResponse<TaskSummary> {
  return {
    items,
    page: {
      page,
      pageSize,
      totalItems: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize))
    }
  };
}

@Injectable()
export class InMemoryTasksRepository implements TasksRepositoryPort {
  constructor() {
    taskStore.set(this, [baseTask]);
  }

  async create(input: TaskCreateRequest): Promise<TaskSummary> {
    const createdAt = "2026-04-14T11:30:00.000Z";
    const tasks = getTasks(this);
    const created: TaskSummary = {
      id: `task-${tasks.length + 1}`,
      createdAt,
      updatedAt: createdAt,
      title: input.title,
      status: "todo",
      assigneeId: input.assigneeId,
      pondId: input.pondId
    };
    tasks.unshift(created);
    return created;
  }

  async update(id: string, input: TaskUpdateRequest): Promise<TaskSummary> {
    const tasks = getTasks(this);
    const current = tasks.find((item) => item.id === id) ?? tasks[0];
    const updated: TaskSummary = {
      ...current,
      ...input,
      updatedAt: "2026-04-14T12:00:00.000Z"
    };
    const index = tasks.findIndex((item) => item.id === id);
    if (index >= 0) {
      tasks[index] = updated;
    }
    return updated;
  }

  async getById(id: string): Promise<TaskSummary> {
    const tasks = getTasks(this);
    return tasks.find((item) => item.id === id) ?? tasks[0];
  }

  async list(query: TasksListQueryContract): Promise<ListResponse<TaskSummary>> {
    const filtered = getTasks(this).filter(
      (item) =>
        (!query.assigneeId || item.assigneeId === query.assigneeId) &&
        (!query.pondId || item.pondId === query.pondId) &&
        (!query.status || item.status === query.status) &&
        (!query.search || item.title.toLowerCase().includes(query.search.toLowerCase()))
    );
    return createPage(filtered, query.page, query.pageSize);
  }
}
