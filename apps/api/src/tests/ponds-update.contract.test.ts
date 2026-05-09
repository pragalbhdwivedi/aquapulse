import { describe, expect, it } from "vitest";
import { InMemoryPondsRepository } from "../modules/ponds/repositories/in-memory-ponds.repository";
import { PondsApplicationService } from "../modules/ponds/application/ponds.application-service";
import { PondsController } from "../modules/ponds/ponds.controller";

describe("Ponds update vertical slice", () => {
  it("updates a pond through the in-memory repository path", async () => {
    const repository = new InMemoryPondsRepository();
    const service = new PondsApplicationService(repository);

    const updated = await service.update("pond-1", {
      name: "North Pond 1 - Updated",
      status: "maintenance"
    });

    expect(updated.data.id).toBe("pond-1");
    expect(updated.data.name).toBe("North Pond 1 - Updated");
    expect(updated.data.status).toBe("maintenance");
  });

  it("keeps controller -> mapper -> service -> envelope delegation stable for update", async () => {
    const repository = new InMemoryPondsRepository();
    const applicationService = new PondsApplicationService(repository);
    const controller = new PondsController(
      { getPlaceholder: async () => ({ ok: true }) } as never,
      applicationService
    );

    const response = await controller.update("pond-1", {
      name: "North Pond 1 - Updated",
      status: "maintenance"
    });

    expect(response.ok).toBe(true);
    expect(response.data.id).toBe("pond-1");
    expect(response.data.name).toBe("North Pond 1 - Updated");
    expect(response.data.status).toBe("maintenance");
  });
});
