import { describe, expect, it } from "vitest";
import { InMemoryWaterQualityRepository } from "../modules/water-quality/repositories/in-memory-water-quality.repository";
import { WaterQualityApplicationService } from "../modules/water-quality/application/water-quality.application-service";
import { WaterQualityController } from "../modules/water-quality/water-quality.controller";

describe("Water-quality update vertical slice", () => {
  it("updates a reading through the in-memory repository path", async () => {
    const repository = new InMemoryWaterQualityRepository();
    const service = new WaterQualityApplicationService(
      repository,
      { upsertOperationalDecision: async () => undefined } as never
    );

    const updated = await service.update("wq-1", {
      temperatureC: 29.4,
      ph: 7.8
    });

    expect(updated.data.id).toBe("wq-1");
    expect(updated.data.temperatureC).toBe(29.4);
    expect(updated.data.ph).toBe(7.8);
  });

  it("keeps controller -> mapper -> service -> envelope delegation stable for update", async () => {
    const repository = new InMemoryWaterQualityRepository();
    const applicationService = new WaterQualityApplicationService(
      repository,
      { upsertOperationalDecision: async () => undefined } as never
    );
    const controller = new WaterQualityController(
      { getPlaceholder: async () => ({ ok: true }) } as never,
      applicationService
    );

    const response = await controller.update("wq-1", {
      temperatureC: 29.1,
      ph: 7.7
    });

    expect(response.ok).toBe(true);
    expect(response.data.id).toBe("wq-1");
    expect(response.data.temperatureC).toBe(29.1);
    expect(response.data.ph).toBe(7.7);
  });
});
