import { NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { TasksApplicationService } from "../modules/tasks/application/tasks.application-service";
import { InMemoryTasksRepository } from "../modules/tasks/repositories/in-memory-tasks.repository";

describe("Task read-scope by assignee", () => {
  it("scopes task list reads to the requesting keycloak operator assignee", async () => {
    const service = new TasksApplicationService(new InMemoryTasksRepository());

    const tasks = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-1", provider: "keycloak" }
    );

    expect(tasks.data.items.length).toBeGreaterThan(0);
    expect(tasks.data.items.every((item) => item.assigneeId === "user-1")).toBe(true);
    expect(tasks.data.items.some((item) => item.id === "task-1")).toBe(true);
    expect(tasks.data.items.some((item) => item.id === "task-2")).toBe(false);
    expect(tasks.data.items.some((item) => item.id === "task-3")).toBe(false);
  });

  it("returns not found when a keycloak operator requests a task assigned to someone else", async () => {
    const service = new TasksApplicationService(new InMemoryTasksRepository());

    await expect(
      service.getById("task-2", { id: "user-1", provider: "keycloak" })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns not found when a keycloak operator requests an unassigned task", async () => {
    const service = new TasksApplicationService(new InMemoryTasksRepository());

    await expect(
      service.getById("task-3", { id: "user-1", provider: "keycloak" })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("keeps local-safe task reads broad for development flows", async () => {
    const service = new TasksApplicationService(new InMemoryTasksRepository());

    const tasks = await service.list(
      { page: 1, pageSize: 20 },
      { id: "local-operator", provider: "local" }
    );

    expect(tasks.data.items.some((item) => item.id === "task-1")).toBe(true);
    expect(tasks.data.items.some((item) => item.id === "task-2")).toBe(true);
    expect(tasks.data.items.some((item) => item.id === "task-3")).toBe(true);
  });
});
