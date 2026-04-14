import { describe, expect, it } from "vitest";
import { AlertsApplicationService } from "../modules/alerts/application/alerts.application-service";
import { InMemoryAlertsRepository } from "../modules/alerts/repositories/in-memory-alerts.repository";
import { FeedApplicationService } from "../modules/feed/application/feed.application-service";
import { FeedController } from "../modules/feed/feed.controller";
import { InMemoryFeedRepository } from "../modules/feed/repositories/in-memory-feed.repository";

describe("Feed update vertical slice", () => {
  it("updates a feed entry through the in-memory repository path", async () => {
    const repository = new InMemoryFeedRepository();
    const alerts = new AlertsApplicationService(new InMemoryAlertsRepository());
    const service = new FeedApplicationService(repository, alerts);
    const created = await service.create({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Starter Feed",
      quantityKg: 18,
      fedAt: "2026-04-14T06:00:00.000Z"
    });

    const updated = await service.update(created.data.id, {
      feedType: "Grower Feed",
      quantityKg: 24
    });

    expect(updated.data.id).toBe(created.data.id);
    expect(updated.data.feedType).toBe("Grower Feed");
    expect(updated.data.quantityKg).toBe(24);
  });

  it("keeps controller -> mapper -> service -> envelope delegation stable for update", async () => {
    const repository = new InMemoryFeedRepository();
    const alerts = new AlertsApplicationService(new InMemoryAlertsRepository());
    const applicationService = new FeedApplicationService(repository, alerts);
    const controller = new FeedController(
      { getPlaceholder: async () => ({ ok: true }) } as never,
      applicationService
    );

    const created = await controller.create({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Starter Feed",
      quantityKg: 18,
      fedAt: "2026-04-14T06:00:00.000Z"
    });
    const response = await controller.update(created.data.id, {
      feedType: "Finisher Feed",
      quantityKg: 27
    });

    expect(response.ok).toBe(true);
    expect(response.data.id).toBe(created.data.id);
    expect(response.data.feedType).toBe("Finisher Feed");
    expect(response.data.quantityKg).toBe(27);
  });
});
