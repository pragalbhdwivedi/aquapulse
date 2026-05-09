import { describe, expect, it } from "vitest";
import { createRepositories, createRepositoriesFromConfig } from "../repositories";
import { createMockApiClients } from "../clients";
import {
  createWaterQualityEntrySubmitter,
  submitWaterQualityEntry
} from "../features/water-quality-entry";
import { submitWaterQualityUpdate } from "../features/water-quality-update";

describe("Water-quality write flow", () => {
  it("supports valid submission through the default mock-backed repository path", async () => {
    const repositories = createRepositories(createMockApiClients());
    const submit = createWaterQualityEntrySubmitter(repositories);
    const result = await submit({
      pondId: "pond-1",
      recordedAt: "2026-04-14T08:00:00.000Z",
      temperatureC: 28.9,
      ph: 7.5
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.pondId).toBe("pond-1");
      expect(result.data.temperatureC).toBe(28.9);
      expect(result.refreshedList?.items[0]?.pondId).toBe("pond-1");
    }
  });

  it("returns validation-style failure for invalid submission before calling the client path", async () => {
    const result = await submitWaterQualityEntry({
      pondId: "",
      recordedAt: "",
      temperatureC: undefined,
      ph: undefined
    });

    expect(result.status).toBe("validation_error");
    if (result.status === "validation_error") {
      expect(result.fieldErrors.pondId).toBeTruthy();
      expect(result.fieldErrors.recordedAt).toBeTruthy();
    }
  });

  it("remains structurally compatible with placeholder-http runtime", async () => {
    const repositories = createRepositoriesFromConfig({
      mode: "http",
      enablePlaceholderHttp: true
    });
    const result = await repositories.waterQuality.create({
      pondId: "pond-1",
      recordedAt: "2026-04-14T10:00:00.000Z",
      temperatureC: 29.3,
      ph: 7.7
    });
    const list = await repositories.waterQuality.listByPond("pond-1", {
      page: 1,
      pageSize: 20
    });

    expect(result.data.pondId).toBe("pond-1");
    expect(list.data.items[0]?.pondId).toBe("pond-1");
  });

  it("returns validation-style failure for invalid bounded update input before calling the client path", async () => {
    const result = await submitWaterQualityUpdate("wq-1", "pond-1", {
      recordedAt: ""
    });

    expect(result.status).toBe("validation_error");
    if (result.status === "validation_error") {
      expect(result.fieldErrors.recordedAt).toBeTruthy();
    }
  });
});
