import { NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AlertsApplicationService } from "../modules/alerts/application/alerts.application-service";
import { InMemoryAlertsRepository } from "../modules/alerts/repositories/in-memory-alerts.repository";
import { FeedApplicationService } from "../modules/feed/application/feed.application-service";
import { InMemoryFeedRepository } from "../modules/feed/repositories/in-memory-feed.repository";
import { PondReadAuthorizationService } from "../modules/pond-responsibility/application/pond-read-authorization.service";
import { InMemoryPondResponsibilityRepository } from "../modules/pond-responsibility/repositories/in-memory-pond-responsibility.repository";

describe("Feed read-scope by pond responsibility", () => {
  function createService() {
    return new FeedApplicationService(
      new InMemoryFeedRepository(),
      new AlertsApplicationService(new InMemoryAlertsRepository()),
      new PondReadAuthorizationService(new InMemoryPondResponsibilityRepository())
    );
  }

  it("scopes feed list reads to ponds readable by the requesting keycloak operator", async () => {
    const service = createService();

    const entries = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-1", provider: "keycloak", roles: ["operator"] }
    );

    expect(entries.data.items).toHaveLength(1);
    expect(entries.data.items[0]?.id).toBe("feed-1");
    expect(entries.data.items[0]?.pondId).toBe("pond-1");
  });

  it("returns an empty feed list when the keycloak actor has no active pond responsibilities", async () => {
    const service = createService();

    const entries = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-9", provider: "keycloak", roles: ["operator"] }
    );

    expect(entries.data.items).toHaveLength(0);
    expect(entries.data.page.totalItems).toBe(0);
    expect(entries.data.page.totalPages).toBe(1);
  });

  it("returns not found when a keycloak operator requests an out-of-scope feed detail", async () => {
    const service = createService();

    await expect(
      service.getById("feed-1", { id: "user-2", provider: "keycloak", roles: ["operator"] })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("allows feed detail reads for a keycloak operator with pond responsibility", async () => {
    const service = createService();

    const entry = await service.getById("feed-1", {
      id: "user-1",
      provider: "keycloak",
      roles: ["operator"]
    });

    expect(entry.data.id).toBe("feed-1");
    expect(entry.data.pondId).toBe("pond-1");
  });

  it("keeps local-safe feed reads broad for development flows", async () => {
    const service = createService();

    const entries = await service.list(
      { page: 1, pageSize: 20 },
      { id: "local-operator", provider: "local", roles: ["operator"] }
    );
    const entry = await service.getById("feed-1", {
      id: "local-operator",
      provider: "local",
      roles: ["operator"]
    });

    expect(entries.data.items.some((item) => item.id === "feed-1")).toBe(true);
    expect(entry.data.id).toBe("feed-1");
  });
});
