import { describe, expect, it } from "vitest";
import { createRepositories, createRepositoriesFromConfig } from "../repositories";
import { createMockApiClients } from "../clients";
import { createFeedEntrySubmitter, submitFeedEntry } from "../features/feed-entry";

describe("Feed write flow", () => {
  it("supports valid submission through the default mock-backed repository path", async () => {
    const repositories = createRepositories(createMockApiClients());
    const submit = createFeedEntrySubmitter(repositories);
    const result = await submit({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Grower Feed",
      quantityKg: 24,
      fedAt: "2026-04-14T06:00:00.000Z"
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.feedType).toBe("Grower Feed");
      expect(result.data.quantityKg).toBe(24);
      expect(result.refreshedList?.items[0]?.pondId).toBe("pond-1");
    }
  });

  it("returns validation-style failure for invalid submission before calling the client path", async () => {
    const result = await submitFeedEntry({
      pondId: "",
      batchId: undefined,
      feedType: "",
      quantityKg: 0,
      fedAt: ""
    });

    expect(result.status).toBe("validation_error");
    if (result.status === "validation_error") {
      expect(result.fieldErrors.pondId).toBeTruthy();
      expect(result.fieldErrors.feedType).toBeTruthy();
      expect(result.fieldErrors.quantityKg).toBeTruthy();
      expect(result.fieldErrors.fedAt).toBeTruthy();
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
    const listed = await repositories.feed.list({
      page: 1,
      pageSize: 20,
      pondId: "pond-1"
    });

    expect(created.data.feedType).toBe("Starter Feed");
    expect(listed.data.items[0]?.pondId).toBe("pond-1");
  });
});
