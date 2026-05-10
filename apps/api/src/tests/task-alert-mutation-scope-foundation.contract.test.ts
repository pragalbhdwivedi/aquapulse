import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AlertsApplicationService } from "../modules/alerts/application/alerts.application-service";
import { InMemoryAlertsRepository } from "../modules/alerts/repositories/in-memory-alerts.repository";
import { PondReadAuthorizationService } from "../modules/pond-responsibility/application/pond-read-authorization.service";
import { InMemoryPondResponsibilityRepository } from "../modules/pond-responsibility/repositories/in-memory-pond-responsibility.repository";
import { TasksApplicationService } from "../modules/tasks/application/tasks.application-service";
import { InMemoryTasksRepository } from "../modules/tasks/repositories/in-memory-tasks.repository";

function createPondAuthorizationService() {
  return new PondReadAuthorizationService(new InMemoryPondResponsibilityRepository());
}

function createTasksService() {
  return new TasksApplicationService(
    new InMemoryTasksRepository(),
    createPondAuthorizationService()
  );
}

function createAlertsService() {
  return new AlertsApplicationService(
    new InMemoryAlertsRepository(),
    { emit: () => undefined } as never,
    createPondAuthorizationService()
  );
}

describe("Task and alert mutation scope foundation", () => {
  it("allows task create for a responsible pond", async () => {
    const service = createTasksService();

    const created = await service.create(
      {
        title: "Inspect intake screen",
        assigneeId: "user-1",
        pondId: "pond-1"
      },
      { id: "user-1", provider: "keycloak" }
    );

    expect(created.data.pondId).toBe("pond-1");
  });

  it("blocks task create for an unauthorized pond", async () => {
    const service = createTasksService();

    await expect(
      service.create(
        {
          title: "Inspect intake screen",
          assigneeId: "user-1",
          pondId: "pond-3"
        },
        { id: "user-1", provider: "keycloak" }
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows task update when the current task is assigned to the caller", async () => {
    const service = createTasksService();

    const updated = await service.update(
      "task-1",
      { status: "done" },
      { id: "user-1", provider: "keycloak" }
    );

    expect(updated.data.id).toBe("task-1");
    expect(updated.data.status).toBe("done");
  });

  it("blocks task update when the current task is not assigned to the caller", async () => {
    const service = createTasksService();

    await expect(
      service.update(
        "task-2",
        { status: "done" },
        { id: "user-1", provider: "keycloak" }
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("blocks task update when moving to an unauthorized pond", async () => {
    const service = createTasksService();

    await expect(
      service.update(
        "task-1",
        { pondId: "pond-3" },
        { id: "user-1", provider: "keycloak" }
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows alert create for a responsible pond", async () => {
    const service = createAlertsService();

    const created = await service.create(
      {
        title: "Operator-created alert",
        severity: "medium",
        source: "feed",
        pondId: "pond-1",
        status: "open"
      },
      { id: "user-1", provider: "keycloak" }
    );

    expect(created.data.pondId).toBe("pond-1");
  });

  it("blocks alert create for an unauthorized pond", async () => {
    const service = createAlertsService();

    await expect(
      service.create(
        {
          title: "Operator-created alert",
          severity: "medium",
          source: "feed",
          pondId: "pond-3",
          status: "open"
        },
        { id: "user-1", provider: "keycloak" }
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows generic alert patch when the current alert is assigned to the caller", async () => {
    const service = createAlertsService();

    const updated = await service.update(
      "alert-1",
      { latestNote: "Reviewed." },
      { id: "user-1", provider: "keycloak" }
    );

    expect(updated.data.id).toBe("alert-1");
    expect(updated.data.latestNote).toBe("Reviewed.");
  });

  it("blocks generic alert patch when the current alert is not assigned to the caller", async () => {
    const service = createAlertsService();

    await expect(
      service.update(
        "alert-2",
        { latestNote: "Reviewed." },
        { id: "user-1", provider: "keycloak" }
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("blocks generic alert patch when moving to an unauthorized pond", async () => {
    const service = createAlertsService();

    await expect(
      service.update(
        "alert-1",
        { pondId: "pond-3" },
        { id: "user-1", provider: "keycloak" }
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("keeps local-safe task and generic alert mutations broad for development flows", async () => {
    const tasks = createTasksService();
    const alerts = createAlertsService();

    const createdTask = await tasks.create(
      {
        title: "Local-safe task",
        assigneeId: "user-9",
        pondId: "pond-99"
      },
      { id: "local-operator", provider: "local" }
    );
    const updatedTask = await tasks.update(
      "task-2",
      { pondId: "pond-77" },
      { id: "local-operator", provider: "local" }
    );
    const createdAlert = await alerts.create(
      {
        title: "Local-safe alert",
        severity: "low",
        source: "feed",
        pondId: "pond-99",
        status: "open"
      },
      { id: "local-operator", provider: "local" }
    );
    const updatedAlert = await alerts.update(
      "alert-2",
      { pondId: "pond-77" },
      { id: "local-operator", provider: "local" }
    );

    expect(createdTask.data.pondId).toBe("pond-99");
    expect(updatedTask.data.pondId).toBe("pond-77");
    expect(createdAlert.data.pondId).toBe("pond-99");
    expect(updatedAlert.data.pondId).toBe("pond-77");
  });
});
