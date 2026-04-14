import { describe, expect, it } from "vitest";
import { taskCreateSchema, waterQualityEntryCreateSchema } from "@aquapulse/validation";
import { createValidatedSubmitter } from "../features/form-submission";

describe("Shared form submission helper", () => {
  it("produces the same normalized success shape for water-quality and task submissions", async () => {
    const submitWaterQuality = createValidatedSubmitter({
      schema: waterQualityEntryCreateSchema,
      fields: ["pondId", "recordedAt", "temperatureC", "ph"] as const,
      submit: async (input) => ({
        id: "wq-test",
        createdAt: input.recordedAt,
        updatedAt: input.recordedAt,
        pondId: input.pondId,
        recordedAt: input.recordedAt,
        temperatureC: input.temperatureC,
        ph: input.ph
      })
    });
    const submitTask = createValidatedSubmitter({
      schema: taskCreateSchema,
      fields: ["title", "assigneeId", "pondId"] as const,
      submit: async (input) => ({
        id: "task-test",
        createdAt: "2026-04-14T00:00:00.000Z",
        updatedAt: "2026-04-14T00:00:00.000Z",
        title: input.title,
        status: "todo" as const,
        assigneeId: input.assigneeId,
        pondId: input.pondId
      })
    });

    const waterQualityResult = await submitWaterQuality({
      pondId: "pond-1",
      recordedAt: "2026-04-14T07:00:00.000Z",
      temperatureC: 29,
      ph: 7.4
    });
    const taskResult = await submitTask({
      title: "Inspect feeders",
      assigneeId: "user-2",
      pondId: "pond-1"
    });

    expect(waterQualityResult.status).toBe("success");
    expect(taskResult.status).toBe("success");
  });

  it("produces stable validation-error field maps across both writable flows", async () => {
    const submitTask = createValidatedSubmitter({
      schema: taskCreateSchema,
      fields: ["title", "assigneeId", "pondId"] as const,
      submit: async (input) => input
    });

    const result = await submitTask({
      title: "",
      assigneeId: undefined,
      pondId: "pond-1"
    });

    expect(result.status).toBe("validation_error");
    if (result.status === "validation_error") {
      expect(result.fieldErrors.title).toBeTruthy();
    }
  });
});
