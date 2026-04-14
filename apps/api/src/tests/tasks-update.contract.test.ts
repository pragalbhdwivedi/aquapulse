import { describe, expect, it } from "vitest";
import { TasksApplicationService } from "../modules/tasks/application/tasks.application-service";
import { InMemoryTasksRepository } from "../modules/tasks/repositories/in-memory-tasks.repository";
import { TasksController } from "../modules/tasks/tasks.controller";

describe("Tasks update vertical slice", () => {
  it("updates a task through the in-memory repository path", async () => {
    const repository = new InMemoryTasksRepository();
    const service = new TasksApplicationService(repository);
    const created = await service.create({
      title: "Initial inspection",
      assigneeId: "user-1",
      pondId: "pond-1"
    });

    const updated = await service.update(created.data.id, {
      title: "Completed inspection",
      status: "done",
      assigneeId: "user-9"
    });

    expect(updated.data.id).toBe(created.data.id);
    expect(updated.data.title).toBe("Completed inspection");
    expect(updated.data.status).toBe("done");
    expect(updated.data.assigneeId).toBe("user-9");
  });

  it("keeps controller -> mapper -> service -> envelope delegation stable for update", async () => {
    const repository = new InMemoryTasksRepository();
    const applicationService = new TasksApplicationService(repository);
    const controller = new TasksController(
      { getPlaceholder: async () => ({ ok: true }) } as never,
      applicationService
    );

    const created = await controller.create({
      title: "Review feeder calibration",
      assigneeId: "user-4",
      pondId: "pond-1"
    });
    const response = await controller.update(created.data.id, {
      title: "Review feeder calibration complete",
      status: "in_progress"
    });

    expect(response.ok).toBe(true);
    expect(response.data.id).toBe(created.data.id);
    expect(response.data.title).toBe("Review feeder calibration complete");
    expect(response.data.status).toBe("in_progress");
  });
});
