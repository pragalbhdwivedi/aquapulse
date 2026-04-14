import { describe, expect, it } from "vitest";
import { WaterQualityApplicationService } from "../modules/water-quality/application/water-quality.application-service";
import { InMemoryWaterQualityRepository } from "../modules/water-quality/repositories/in-memory-water-quality.repository";
import { WaterQualityController } from "../modules/water-quality/water-quality.controller";

describe("Water-quality write vertical slice", () => {
  it("creates a water-quality reading through the in-memory repository path", async () => {
    const repository = new InMemoryWaterQualityRepository();
    const service = new WaterQualityApplicationService(repository);

    const created = await service.create({
      pondId: "pond-1",
      recordedAt: "2026-04-14T08:00:00.000Z",
      temperatureC: 29.1,
      ph: 7.4
    });
    const list = await repository.list({ page: 1, pageSize: 20, pondId: "pond-1" });

    expect(created.data.pondId).toBe("pond-1");
    expect(created.data.temperatureC).toBe(29.1);
    expect(list.items[0]?.id).toBe(created.data.id);
  });

  it("keeps controller -> mapper -> service -> envelope delegation stable for create", async () => {
    const repository = new InMemoryWaterQualityRepository();
    const applicationService = new WaterQualityApplicationService(repository);
    const controller = new WaterQualityController(
      { getPlaceholder: async () => ({ ok: true }) } as never,
      applicationService
    );

    const response = await controller.create({
      pondId: "pond-1",
      recordedAt: "2026-04-14T09:00:00.000Z",
      temperatureC: 28.8,
      ph: 7.5
    });

    expect(response.ok).toBe(true);
    expect(response.data.id).toContain("wq-");
    expect(response.data.recordedAt).toBe("2026-04-14T09:00:00.000Z");
  });
});
