import { describe, expect, it } from "vitest";
import { PondsApplicationService } from "../modules/ponds/application/ponds.application-service";
import { PondsController } from "../modules/ponds/ponds.controller";
import { InMemoryPondsRepository } from "../modules/ponds/repositories/in-memory-ponds.repository";

describe("Ponds write vertical slice", () => {
  it("creates a pond through the in-memory repository path", async () => {
    const repository = new InMemoryPondsRepository();
    const service = new PondsApplicationService(repository);

    const created = await service.create({
      name: "South Pond 2",
      code: "SP-02",
      farmId: "farm-2",
      kind: "pond"
    });
    const list = await repository.list({ page: 1, pageSize: 20, farmId: "farm-2" });

    expect(created.data.id).toContain("pond-");
    expect(created.data.name).toBe("South Pond 2");
    expect(list.items[0]?.id).toBe(created.data.id);
  });

  it("keeps controller -> mapper -> service -> envelope delegation stable for create", async () => {
    const repository = new InMemoryPondsRepository();
    const applicationService = new PondsApplicationService(repository);
    const controller = new PondsController(
      { getPlaceholder: async () => ({ ok: true }) } as never,
      applicationService
    );

    const response = await controller.create({
      name: "Tank 7",
      code: "TK-07",
      farmId: "farm-3",
      kind: "tank"
    });

    expect(response.ok).toBe(true);
    expect(response.data.id).toContain("pond-");
    expect(response.data.status).toBe("active");
    expect(response.data.kind).toBe("tank");
  });

  it("keeps controller -> mapper -> service -> envelope delegation stable for bounded detail reads", async () => {
    const repository = new InMemoryPondsRepository();
    const applicationService = new PondsApplicationService(repository);
    const controller = new PondsController(
      { getPlaceholder: async () => ({ ok: true }) } as never,
      applicationService
    );

    const created = await applicationService.create({
      name: "East Pond 3",
      code: "EP-03",
      farmId: "farm-4",
      kind: "pond"
    });
    const response = await controller.getById(created.data.id);

    expect(response.ok).toBe(true);
    expect(response.data.id).toBe(created.data.id);
    expect(response.data.name).toBe("East Pond 3");
  });
});
