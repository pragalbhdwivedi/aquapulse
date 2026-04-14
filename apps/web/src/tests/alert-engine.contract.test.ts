import { describe, expect, it } from "vitest";
import { createRepositories, createRepositoriesFromConfig } from "../repositories";
import { createMockApiClients } from "../clients";

describe("Operational alert engine base", () => {
  it("creates a water-quality alert through the default mock runtime", async () => {
    const repositories = createRepositories(createMockApiClients());

    await repositories.waterQuality.create({
      pondId: "pond-1",
      recordedAt: "2026-04-15T07:00:00.000Z",
      temperatureC: 35.1,
      ph: 9
    });

    const alerts = await repositories.alerts.list({
      page: 1,
      pageSize: 20,
      source: "water-quality",
      search: "threshold breach"
    });

    expect(alerts.data.items.some((item) => item.title === "Water-quality threshold breach")).toBe(true);
  });

  it("updates the same open alert deterministically for repeated water-quality breaches", async () => {
    const repositories = createRepositories(createMockApiClients());

    await repositories.waterQuality.create({
      pondId: "pond-1",
      recordedAt: "2026-04-15T08:00:00.000Z",
      temperatureC: 35,
      ph: 9.1
    });
    await repositories.waterQuality.create({
      pondId: "pond-1",
      recordedAt: "2026-04-15T08:05:00.000Z",
      temperatureC: 34.9,
      ph: 9
    });

    const alerts = await repositories.alerts.list({
      page: 1,
      pageSize: 20,
      source: "water-quality",
      search: "threshold breach"
    });

    expect(alerts.data.items.filter((item) => item.title === "Water-quality threshold breach")).toHaveLength(1);
  });

  it("remains structurally compatible with placeholder-http runtime", async () => {
    const repositories = createRepositoriesFromConfig({
      mode: "http",
      enablePlaceholderHttp: true
    });

    await repositories.feed.create({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Emergency Feed",
      quantityKg: 90,
      fedAt: "2026-04-15T06:00:00.000Z"
    });

    const alerts = await repositories.alerts.list({
      page: 1,
      pageSize: 20,
      source: "feed",
      search: "anomaly"
    });

    expect(alerts.data.items.some((item) => item.title === "Feed quantity anomaly detected")).toBe(true);
  });
});
