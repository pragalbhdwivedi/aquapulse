import { NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AlertsApplicationService } from "../modules/alerts/application/alerts.application-service";
import { InMemoryAlertsRepository } from "../modules/alerts/repositories/in-memory-alerts.repository";
import { PondReadAuthorizationService } from "../modules/pond-responsibility/application/pond-read-authorization.service";
import { InMemoryPondResponsibilityRepository } from "../modules/pond-responsibility/repositories/in-memory-pond-responsibility.repository";
import { WaterQualityApplicationService } from "../modules/water-quality/application/water-quality.application-service";
import { InMemoryWaterQualityRepository } from "../modules/water-quality/repositories/in-memory-water-quality.repository";

describe("Water-quality read-scope by pond responsibility", () => {
  function createService() {
    return new WaterQualityApplicationService(
      new InMemoryWaterQualityRepository(),
      new AlertsApplicationService(new InMemoryAlertsRepository()),
      new PondReadAuthorizationService(new InMemoryPondResponsibilityRepository())
    );
  }

  it("scopes water-quality list reads to ponds readable by the requesting keycloak operator", async () => {
    const service = createService();

    const readings = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-1", provider: "keycloak", roles: ["operator"] }
    );

    expect(readings.data.items).toHaveLength(1);
    expect(readings.data.items[0]?.id).toBe("wq-1");
    expect(readings.data.items[0]?.pondId).toBe("pond-1");
  });

  it("returns an empty water-quality list when the keycloak actor has no active pond responsibilities", async () => {
    const service = createService();

    const readings = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-9", provider: "keycloak", roles: ["operator"] }
    );

    expect(readings.data.items).toHaveLength(0);
    expect(readings.data.page.totalItems).toBe(0);
    expect(readings.data.page.totalPages).toBe(1);
  });

  it("returns not found when a keycloak operator requests an out-of-scope water-quality detail", async () => {
    const service = createService();

    await expect(
      service.getById("wq-1", { id: "user-2", provider: "keycloak", roles: ["operator"] })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("allows water-quality detail reads for a keycloak operator with pond responsibility", async () => {
    const service = createService();

    const reading = await service.getById("wq-1", {
      id: "user-1",
      provider: "keycloak",
      roles: ["operator"]
    });

    expect(reading.data.id).toBe("wq-1");
    expect(reading.data.pondId).toBe("pond-1");
  });

  it("keeps local-safe water-quality reads broad for development flows", async () => {
    const service = createService();

    const readings = await service.list(
      { page: 1, pageSize: 20 },
      { id: "local-operator", provider: "local", roles: ["operator"] }
    );
    const reading = await service.getById("wq-1", {
      id: "local-operator",
      provider: "local",
      roles: ["operator"]
    });

    expect(readings.data.items.some((item) => item.id === "wq-1")).toBe(true);
    expect(reading.data.id).toBe("wq-1");
  });
});
