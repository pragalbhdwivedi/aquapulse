import { describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import type { ListResponse, TaskSummary } from "@aquapulse/types";
import { QueryTasksDto } from "../dto";
import { toTasksItemResponse, toTasksListResponse } from "../mappers/tasks.mapper";
import type { TasksRepositoryPort } from "../ports/tasks-repository.port";
import { TasksApplicationService } from "../application/tasks.application-service";
import { TasksController } from "../tasks.controller";

const task: TaskSummary = {
  id: "task-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  title: "Inspect aeration equipment",
  status: "todo",
  assigneeId: "user-1",
  pondId: "pond-1"
};

const taskList: ListResponse<TaskSummary> = {
  items: [task],
  page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
};

describe("Tasks contracts", () => {
  it("application service reads from the tasks repository port", async () => {
    const repository: TasksRepositoryPort = {
      create: vi.fn().mockResolvedValue(task),
      update: vi.fn().mockResolvedValue(task),
      getById: vi.fn().mockResolvedValue(task),
      list: vi.fn().mockResolvedValue(taskList)
    };

    const service = new TasksApplicationService(repository);
    const result = await service.list(new QueryTasksDto());

    expect(repository.list).toHaveBeenCalledOnce();
    expect(result.data.items[0]?.status).toBe("todo");
  });

  it("application service hides out-of-scope task detail for keycloak users", async () => {
    const repository: TasksRepositoryPort = {
      create: vi.fn().mockResolvedValue(task),
      update: vi.fn().mockResolvedValue(task),
      getById: vi.fn().mockResolvedValue(task),
      list: vi.fn().mockResolvedValue({ items: [], page: taskList.page })
    };

    const service = new TasksApplicationService(repository);

    await expect(
      service.getById("task-2", { id: "user-1", provider: "keycloak" })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 1,
      taskId: "task-2",
      assigneeId: "user-1"
    });
  });

  it("controller returns a list envelope for tasks", async () => {
    const placeholderService = { getPlaceholder: vi.fn().mockResolvedValue({ ok: true }) };
    const appService = {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn().mockResolvedValue({ ok: true, data: taskList }),
      getById: vi.fn()
    };

    const controller = new TasksController(placeholderService as never, appService as never);
    const response = await controller.list(new QueryTasksDto());

    expect(response.ok).toBe(true);
    expect(response.data.items[0]?.title).toContain("Inspect");
  });

  it("mapper preserves task envelope structure", () => {
    expect(toTasksItemResponse(task).data.pondId).toBe("pond-1");
    expect(toTasksListResponse(taskList).data.page.pageSize).toBe(20);
  });
});
