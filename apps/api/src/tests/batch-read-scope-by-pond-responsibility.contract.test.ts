import { NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { BatchesApplicationService } from "../modules/batches/application/batches.application-service";
import { InMemoryBatchesRepository } from "../modules/batches/repositories/in-memory-batches.repository";
import { PondReadAuthorizationService } from "../modules/pond-responsibility/application/pond-read-authorization.service";
import { InMemoryPondResponsibilityRepository } from "../modules/pond-responsibility/repositories/in-memory-pond-responsibility.repository";

describe("Batch read-scope by pond responsibility", () => {
  function createService() {
    return new BatchesApplicationService(
      new InMemoryBatchesRepository(),
      new PondReadAuthorizationService(new InMemoryPondResponsibilityRepository())
    );
  }

  it("scopes batch list reads to ponds readable by the requesting keycloak operator", async () => {
    const service = createService();

    const batches = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-1", provider: "keycloak", roles: ["operator"] }
    );

    expect(batches.data.items).toHaveLength(1);
    expect(batches.data.items[0]?.id).toBe("batch-1");
    expect(batches.data.items[0]?.pondId).toBe("pond-1");
  });

  it("returns an empty batch list when the keycloak actor has no active pond responsibilities", async () => {
    const service = createService();

    const batches = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-9", provider: "keycloak", roles: ["operator"] }
    );

    expect(batches.data.items).toHaveLength(0);
    expect(batches.data.page.totalItems).toBe(0);
    expect(batches.data.page.totalPages).toBe(1);
  });

  it("returns not found when a keycloak operator requests an out-of-scope batch detail", async () => {
    const service = createService();

    await expect(
      service.getById("batch-1", { id: "user-2", provider: "keycloak", roles: ["operator"] })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("allows batch detail reads for a keycloak operator with pond responsibility", async () => {
    const service = createService();

    const batch = await service.getById("batch-1", {
      id: "user-1",
      provider: "keycloak",
      roles: ["operator"]
    });

    expect(batch.data.id).toBe("batch-1");
    expect(batch.data.pondId).toBe("pond-1");
  });

  it("keeps local-safe batch reads broad for development flows", async () => {
    const service = createService();

    const batches = await service.list(
      { page: 1, pageSize: 20 },
      { id: "local-operator", provider: "local", roles: ["operator"] }
    );
    const batch = await service.getById("batch-1", {
      id: "local-operator",
      provider: "local",
      roles: ["operator"]
    });

    expect(batches.data.items.some((item) => item.id === "batch-1")).toBe(true);
    expect(batch.data.id).toBe("batch-1");
  });
});
