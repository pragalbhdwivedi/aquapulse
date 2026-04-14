import { describe, expect, it } from "vitest";
import { AlertsApplicationService } from "../modules/alerts/application/alerts.application-service";
import { AlertsController } from "../modules/alerts/alerts.controller";
import { InMemoryAlertsRepository } from "../modules/alerts/repositories/in-memory-alerts.repository";

describe("Alerts lifecycle flow", () => {
  it("acknowledges and resolves alerts through the in-memory repository path", async () => {
    const repository = new InMemoryAlertsRepository();
    const service = new AlertsApplicationService(repository);

    const acknowledged = await service.acknowledge("alert-1", {});
    const resolved = await service.resolve("alert-1", {});

    expect(acknowledged.data.status).toBe("acknowledged");
    expect(resolved.data.status).toBe("resolved");
  });

  it("keeps controller -> mapper -> service -> envelope delegation stable for lifecycle actions", async () => {
    const repository = new InMemoryAlertsRepository();
    const applicationService = new AlertsApplicationService(repository);
    const controller = new AlertsController(
      { getPlaceholder: async () => ({ ok: true }) } as never,
      applicationService
    );

    const acknowledged = await controller.acknowledge("alert-1", {});
    const resolved = await controller.resolve("alert-1", {});

    expect(acknowledged.ok).toBe(true);
    expect(acknowledged.data.status).toBe("acknowledged");
    expect(resolved.data.status).toBe("resolved");
  });
});
