import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AlertsApplicationService } from "../modules/alerts/application/alerts.application-service";
import { InMemoryAlertsRepository } from "../modules/alerts/repositories/in-memory-alerts.repository";
import { FeedApplicationService } from "../modules/feed/application/feed.application-service";
import { InMemoryFeedRepository } from "../modules/feed/repositories/in-memory-feed.repository";
import { PondReadAuthorizationService } from "../modules/pond-responsibility/application/pond-read-authorization.service";
import { InMemoryPondResponsibilityRepository } from "../modules/pond-responsibility/repositories/in-memory-pond-responsibility.repository";
import { WaterQualityApplicationService } from "../modules/water-quality/application/water-quality.application-service";
import { InMemoryWaterQualityRepository } from "../modules/water-quality/repositories/in-memory-water-quality.repository";

function createPondAuthorizationService() {
  return new PondReadAuthorizationService(new InMemoryPondResponsibilityRepository());
}

function createWaterQualityService() {
  return new WaterQualityApplicationService(
    new InMemoryWaterQualityRepository(),
    new AlertsApplicationService(new InMemoryAlertsRepository()),
    createPondAuthorizationService()
  );
}

function createFeedService() {
  return new FeedApplicationService(
    new InMemoryFeedRepository(),
    new AlertsApplicationService(new InMemoryAlertsRepository()),
    createPondAuthorizationService()
  );
}

describe("Operational write scope by pond responsibility", () => {
  it("allows water-quality create for a responsible pond", async () => {
    const service = createWaterQualityService();

    const created = await service.create(
      {
        pondId: "pond-1",
        recordedAt: "2026-05-10T06:00:00.000Z",
        temperatureC: 29.4,
        ph: 7.7
      },
      { id: "user-1", provider: "keycloak", roles: ["operator"] }
    );

    expect(created.data.pondId).toBe("pond-1");
  });

  it("blocks water-quality create for an unauthorized pond", async () => {
    const service = createWaterQualityService();

    await expect(
      service.create(
        {
          pondId: "pond-3",
          recordedAt: "2026-05-10T06:00:00.000Z",
          temperatureC: 29.4,
          ph: 7.7
        },
        { id: "user-1", provider: "keycloak", roles: ["operator"] }
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows water-quality update for an existing responsible pond", async () => {
    const service = createWaterQualityService();

    const updated = await service.update(
      "wq-1",
      {
        temperatureC: 30.2
      },
      { id: "user-1", provider: "keycloak", roles: ["operator"] }
    );

    expect(updated.data.id).toBe("wq-1");
    expect(updated.data.pondId).toBe("pond-1");
  });

  it("blocks water-quality update for an unauthorized existing pond", async () => {
    const service = createWaterQualityService();

    await expect(
      service.update(
        "wq-1",
        { temperatureC: 30.2 },
        { id: "user-2", provider: "keycloak", roles: ["operator"] }
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("blocks water-quality update when moving a record to an unauthorized pond", async () => {
    const service = createWaterQualityService();

    await expect(
      service.update(
        "wq-1",
        { pondId: "pond-3" },
        { id: "user-1", provider: "keycloak", roles: ["operator"] }
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows feed create for a responsible pond", async () => {
    const service = createFeedService();

    const created = await service.create(
      {
        pondId: "pond-1",
        batchId: "batch-1",
        feedType: "Grower Feed",
        quantityKg: 24,
        fedAt: "2026-05-10T06:00:00.000Z"
      },
      { id: "user-1", provider: "keycloak", roles: ["operator"] }
    );

    expect(created.data.pondId).toBe("pond-1");
  });

  it("blocks feed create for an unauthorized pond", async () => {
    const service = createFeedService();

    await expect(
      service.create(
        {
          pondId: "pond-3",
          batchId: "batch-1",
          feedType: "Grower Feed",
          quantityKg: 24,
          fedAt: "2026-05-10T06:00:00.000Z"
        },
        { id: "user-1", provider: "keycloak", roles: ["operator"] }
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows feed update for an existing responsible pond", async () => {
    const service = createFeedService();

    const updated = await service.update(
      "feed-1",
      {
        quantityKg: 22
      },
      { id: "user-1", provider: "keycloak", roles: ["operator"] }
    );

    expect(updated.data.id).toBe("feed-1");
    expect(updated.data.pondId).toBe("pond-1");
  });

  it("blocks feed update for an unauthorized existing pond", async () => {
    const service = createFeedService();

    await expect(
      service.update(
        "feed-1",
        { quantityKg: 22 },
        { id: "user-2", provider: "keycloak", roles: ["operator"] }
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("keeps local-safe operational writes broad for development flows", async () => {
    const waterQualityService = createWaterQualityService();
    const feedService = createFeedService();

    const createdReading = await waterQualityService.create(
      {
        pondId: "pond-99",
        recordedAt: "2026-05-10T06:00:00.000Z",
        temperatureC: 27.1,
        ph: 7.2
      },
      { id: "local-operator", provider: "local", roles: ["operator"] }
    );
    const updatedReading = await waterQualityService.update(
      "wq-1",
      {
        pondId: "pond-77"
      },
      { id: "local-operator", provider: "local", roles: ["operator"] }
    );
    const createdFeed = await feedService.create(
      {
        pondId: "pond-99",
        batchId: "batch-99",
        feedType: "Local Feed",
        quantityKg: 10,
        fedAt: "2026-05-10T06:00:00.000Z"
      },
      { id: "local-operator", provider: "local", roles: ["operator"] }
    );
    const updatedFeed = await feedService.update(
      "feed-1",
      {
        quantityKg: 11
      },
      { id: "local-operator", provider: "local", roles: ["operator"] }
    );

    expect(createdReading.data.pondId).toBe("pond-99");
    expect(updatedReading.data.pondId).toBe("pond-77");
    expect(createdFeed.data.pondId).toBe("pond-99");
    expect(updatedFeed.data.id).toBe("feed-1");
  });
});
