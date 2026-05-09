import { NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { PondsApplicationService } from "../modules/ponds/application/ponds.application-service";
import { InMemoryPondsRepository } from "../modules/ponds/repositories/in-memory-ponds.repository";
import { PondReadAuthorizationService } from "../modules/pond-responsibility/application/pond-read-authorization.service";
import { InMemoryPondResponsibilityRepository } from "../modules/pond-responsibility/repositories/in-memory-pond-responsibility.repository";

describe("Pond read-scope by responsibility", () => {
  function createService() {
    return new PondsApplicationService(
      new InMemoryPondsRepository(),
      new PondReadAuthorizationService(new InMemoryPondResponsibilityRepository())
    );
  }

  it("scopes pond list reads to the requesting keycloak operator's active pond responsibilities", async () => {
    const service = createService();

    const ponds = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-1", provider: "keycloak", roles: ["operator"] }
    );

    expect(ponds.data.items).toHaveLength(1);
    expect(ponds.data.items[0]?.id).toBe("pond-1");
  });

  it("returns an empty pond list when the keycloak actor has no active pond responsibilities", async () => {
    const service = createService();

    const ponds = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-9", provider: "keycloak", roles: ["operator"] }
    );

    expect(ponds.data.items).toHaveLength(0);
    expect(ponds.data.page.totalItems).toBe(0);
    expect(ponds.data.page.totalPages).toBe(1);
  });

  it("returns not found when a keycloak operator requests an out-of-scope pond detail", async () => {
    const service = createService();

    await expect(
      service.getById("pond-1", { id: "user-2", provider: "keycloak", roles: ["operator"] })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("allows pond detail reads for a keycloak operator with an active responsibility", async () => {
    const service = createService();

    const pond = await service.getById("pond-1", {
      id: "user-1",
      provider: "keycloak",
      roles: ["operator"]
    });

    expect(pond.data.id).toBe("pond-1");
  });

  it("keeps local-safe pond reads broad for development flows", async () => {
    const service = createService();

    const ponds = await service.list(
      { page: 1, pageSize: 20 },
      { id: "local-operator", provider: "local", roles: ["operator"] }
    );
    const pond = await service.getById("pond-1", {
      id: "local-operator",
      provider: "local",
      roles: ["operator"]
    });

    expect(ponds.data.items.some((item) => item.id === "pond-1")).toBe(true);
    expect(pond.data.id).toBe("pond-1");
  });
});
