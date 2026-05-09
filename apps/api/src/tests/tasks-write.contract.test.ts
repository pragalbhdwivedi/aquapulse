import { describe, expect, it } from "vitest";
import { TasksApplicationService } from "../modules/tasks/application/tasks.application-service";
import { InMemoryTasksRepository } from "../modules/tasks/repositories/in-memory-tasks.repository";
import { TasksController } from "../modules/tasks/tasks.controller";

describe("Tasks write vertical slice", () => {
  it("creates a task through the in-memory repository path", async () => {
    const repository = new InMemoryTasksRepository();
    const service = new TasksApplicationService(repository);

    const created = await service.create({
      title: "Inspect intake screen",
      assigneeId: "user-2",
      pondId: "pond-1"
    });
    const list = await repository.list({ page: 1, pageSize: 20, pondId: "pond-1" });

    expect(created.data.id).toContain("task-");
    expect(created.data.title).toBe("Inspect intake screen");
    expect(list.items[0]?.id).toBe(created.data.id);
  });

  it("keeps controller -> mapper -> service -> envelope delegation stable for create", async () => {
    const repository = new InMemoryTasksRepository();
    const applicationService = new TasksApplicationService(repository);
    const controller = new TasksController(
      { getPlaceholder: async () => ({ ok: true }) } as never,
      applicationService
    );

    const response = await controller.create({
      title: "Verify backup aerator",
      assigneeId: "user-3",
      pondId: "pond-1"
    });

    expect(response.ok).toBe(true);
    expect(response.data.id).toContain("task-");
    expect(response.data.status).toBe("todo");
    expect(response.data.title).toBe("Verify backup aerator");
  });

  it("keeps controller -> mapper -> service -> envelope delegation stable for bounded detail reads", async () => {
    const repository = new InMemoryTasksRepository();
    const applicationService = new TasksApplicationService(repository);
    const controller = new TasksController(
      { getPlaceholder: async () => ({ ok: true }) } as never,
      applicationService
    );

    const created = await applicationService.create({
      title: "Inspect sluice gate",
      assigneeId: "user-4",
      pondId: "pond-2"
    });
    const response = await controller.getById(created.data.id);

    expect(response.ok).toBe(true);
    expect(response.data.id).toBe(created.data.id);
    expect(response.data.title).toBe("Inspect sluice gate");
  });
});
