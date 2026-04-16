import { describe, expect, it } from "vitest";
import { createRepositories, createRepositoriesFromConfig } from "../repositories";
import { createMockApiClients } from "../clients";
import { createFeedUpdateSubmitter, submitFeedUpdate } from "../features/feed-update";

describe("Feed update flow", () => {
  it("supports valid update through the default mock-backed repository path", async () => {
    const repositories = createRepositories(createMockApiClients());
    const created = await repositories.feed.create({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Starter Feed",
      quantityKg: 18,
      fedAt: "2026-04-14T06:00:00.000Z"
    });
    const submit = createFeedUpdateSubmitter(repositories)(created.data.id);
    const result = await submit({
      feedType: "Grower Feed",
      quantityKg: 24
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.feedType).toBe("Grower Feed");
      expect(result.refreshedList?.items[0]?.id).toBe(created.data.id);
      expect(result.refreshedDetail?.quantityKg).toBe(24);
    }
  });

  it("returns validation-style failure for invalid update before calling the client path", async () => {
    const result = await submitFeedUpdate("feed-1", {
      feedType: ""
    });

    expect(result.status).toBe("validation_error");
    if (result.status === "validation_error") {
      expect(result.fieldErrors.feedType).toBeTruthy();
    }
  });

  it("remains structurally compatible with placeholder-http runtime", async () => {
    const repositories = createRepositoriesFromConfig({
      mode: "http",
      enablePlaceholderHttp: true
    });

    const created = await repositories.feed.create({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Starter Feed",
      quantityKg: 18,
      fedAt: "2026-04-14T06:00:00.000Z"
    });
    const updated = await repositories.feed.update(created.data.id, {
      feedType: "Grower Feed",
      quantityKg: 24
    });
    const detail = await repositories.feed.getById(created.data.id);

    expect(updated.data.feedType).toBe("Grower Feed");
    expect(detail.data.quantityKg).toBe(24);
  });
});
