import { describe, expect, it } from "vitest";
import { FeedApplicationService } from "../modules/feed/application/feed.application-service";
import { FeedController } from "../modules/feed/feed.controller";
import { InMemoryFeedRepository } from "../modules/feed/repositories/in-memory-feed.repository";

describe("Feed write vertical slice", () => {
  it("creates a feed entry through the in-memory repository path", async () => {
    const repository = new InMemoryFeedRepository();
    const service = new FeedApplicationService(repository);

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
    const applicationService = new FeedApplicationService(repository);
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
});
