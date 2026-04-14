import { describe, expect, it } from "vitest";
import { createRepositories, createRepositoriesFromConfig } from "../repositories";
import { createMockApiClients } from "../clients";
import { createAlertLifecycleSubmitter, submitAlertLifecycleAction } from "../features/alert-lifecycle";

describe("Alerts lifecycle flow", () => {
  it("supports acknowledge and resolve through the default mock-backed repository path", async () => {
    const repositories = createRepositories(createMockApiClients());
    const acknowledge = createAlertLifecycleSubmitter(repositories, "acknowledge")("alert-1");
    const resolve = createAlertLifecycleSubmitter(repositories, "resolve")("alert-1");

    const acknowledged = await acknowledge({ note: "Checked dissolved oxygen meter." });
    const resolved = await resolve({ note: "Values back in range." });

    expect(acknowledged.status).toBe("success");
    expect(resolved.status).toBe("success");
    if (acknowledged.status === "success" && resolved.status === "success") {
      expect(acknowledged.data.status).toBe("acknowledged");
      expect(resolved.data.status).toBe("resolved");
      expect(resolved.data.latestNote).toBe("Values back in range.");
      expect(resolved.data.actionHistory?.map((item) => item.action)).toEqual([
        "created",
        "acknowledged",
        "resolved"
      ]);
      expect(resolved.refreshedList?.items.find((item) => item.id === "alert-1")?.status).toBe("resolved");
    }
  });

  it("supports lifecycle actions through placeholder-http runtime", async () => {
    const repositories = createRepositoriesFromConfig({
      mode: "http",
      enablePlaceholderHttp: true
    });

    const acknowledged = await repositories.alerts.acknowledge("alert-1", { note: "Reviewed in HTTP mode." });
    const resolved = await repositories.alerts.resolve("alert-1", { note: "Closed in HTTP mode." });

    expect(acknowledged.data.status).toBe("acknowledged");
    expect(resolved.data.status).toBe("resolved");
    expect(resolved.data.actionHistory?.at(-1)?.note).toBe("Closed in HTTP mode.");
  });

  it("keeps the public submit helper stable", async () => {
    const result = await submitAlertLifecycleAction("acknowledge", "alert-1", {
      note: "Operator follow-up."
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.status).toBe("acknowledged");
      expect(result.data.latestNote).toBe("Operator follow-up.");
    }
  });

  it("supports review-queue filtering and sorting through the frontend repository path", async () => {
    const repositories = createRepositories(createMockApiClients());

    await repositories.alerts.acknowledge("alert-1", { note: "Queue review note." });
    await repositories.feed.create({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Emergency Feed",
      quantityKg: 95,
      fedAt: "2026-04-15T11:00:00.000Z"
    });

    const acknowledged = await repositories.alerts.list({
      page: 1,
      pageSize: 20,
      status: "acknowledged",
      hasLatestNote: true,
      sortBy: "updatedAt_desc"
    });
    const newest = await repositories.alerts.list({
      page: 1,
      pageSize: 20,
      sortBy: "createdAt_desc"
    });

    expect(acknowledged.data.items[0]?.status).toBe("acknowledged");
    expect(acknowledged.data.items[0]?.latestNote).toBeTruthy();
    expect(newest.data.items[0]?.updatedAt >= newest.data.items.at(-1)?.updatedAt!).toBe(true);
  });
});
