import { describe, expect, it } from "vitest";
import { createMockApiClients } from "../clients";
import { createRepositories, createRepositoriesFromConfig } from "../repositories";
import {
  createWaterQualityUpdateSubmitter,
  submitWaterQualityUpdate
} from "../features/water-quality-update";

describe("Water-quality update flow", () => {
  it("supports valid update through the default mock-backed repository path", async () => {
    const repositories = createRepositories(createMockApiClients());
    const reading = await repositories.waterQuality.getById("wq-1");
    const submit = createWaterQualityUpdateSubmitter(repositories)(
      reading.data.id,
      reading.data.pondId
    );
    const result = await submit({
      pondId: reading.data.pondId,
      recordedAt: "2026-04-15T08:30:00.000Z",
      temperatureC: 29.5,
      ph: 7.9
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.id).toBe(reading.data.id);
      expect(result.data.temperatureC).toBe(29.5);
      expect(result.refreshedDetail?.recordedAt).toBe("2026-04-15T08:30:00.000Z");
    }
  });

  it("returns validation-style failure for invalid update before calling the client path", async () => {
    const result = await submitWaterQualityUpdate("wq-1", "pond-1", {
      recordedAt: ""
    });

    expect(result.status).toBe("validation_error");
    if (result.status === "validation_error") {
      expect(result.fieldErrors.recordedAt).toBeTruthy();
    }
  });

  it("remains structurally compatible with placeholder-http runtime", async () => {
    const repositories = createRepositoriesFromConfig({
      mode: "http",
      enablePlaceholderHttp: true
    });

    const updated = await repositories.waterQuality.update("wq-1", {
      pondId: "pond-1",
      recordedAt: "2026-04-15T11:00:00.000Z",
      temperatureC: 30,
      ph: 7.4
    });
    const detail = await repositories.waterQuality.getById("wq-1");

    expect(updated.data.id).toBe("wq-1");
    expect(detail.data.recordedAt).toBe("2026-04-15T11:00:00.000Z");
  });
});
