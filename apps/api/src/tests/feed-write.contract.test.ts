import { describe, expect, it } from "vitest";
import { AlertsApplicationService } from "../modules/alerts/application/alerts.application-service";
import { InMemoryAlertsRepository } from "../modules/alerts/repositories/in-memory-alerts.repository";
import { FeedApplicationService } from "../modules/feed/application/feed.application-service";
import { FeedController } from "../modules/feed/feed.controller";
import { InMemoryFeedRepository } from "../modules/feed/repositories/in-memory-feed.repository";

describe("Feed write vertical slice", () => {
  it("creates a feed entry through the in-memory repository path", async () => {
    const repository = new InMemoryFeedRepository();
    const alerts = new AlertsApplicationService(new InMemoryAlertsRepository());
    const service = new FeedApplicationService(repository, alerts);

    const created = await service.create({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Grower Feed",
      quantityKg: 24,
      fedAt: "2026-04-14T06:00:00.000Z"
    });
    const list = await repository.list({ page: 1, pageSize: 20, pondId: "pond-1" });

    expect(created.data.id).toContain("feed-");
    expect(created.data.feedType).toBe("Grower Feed");
    expect(list.items[0]?.id).toBe(created.data.id);
  });

  it("keeps controller -> mapper -> service -> envelope delegation stable for create", async () => {
    const repository = new InMemoryFeedRepository();
    const alerts = new AlertsApplicationService(new InMemoryAlertsRepository());
    const applicationService = new FeedApplicationService(repository, alerts);
    const controller = new FeedController(
      { getPlaceholder: async () => ({ ok: true }) } as never,
      applicationService
    );

    const response = await controller.create({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Starter Feed",
      quantityKg: 20,
      fedAt: "2026-04-14T05:30:00.000Z"
    });

    expect(response.ok).toBe(true);
    expect(response.data.id).toContain("feed-");
    expect(response.data.feedType).toBe("Starter Feed");
    expect(response.data.quantityKg).toBe(20);
  });

  it("supports a simple deterministic feed anomaly alert path", async () => {
    const repository = new InMemoryFeedRepository();
    const alertsRepository = new InMemoryAlertsRepository();
    const alerts = new AlertsApplicationService(alertsRepository);
    const service = new FeedApplicationService(repository, alerts);

    await service.create({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Emergency Feed",
      quantityKg: 95,
      fedAt: "2026-04-15T06:00:00.000Z"
    });

    const openAlerts = await alertsRepository.listOpen();
    const anomaly = openAlerts.items.find((item) => item.title === "Feed quantity anomaly detected");

    expect(anomaly?.severity).toBe("medium");
    expect(anomaly?.source).toBe("feed");
  });
});
