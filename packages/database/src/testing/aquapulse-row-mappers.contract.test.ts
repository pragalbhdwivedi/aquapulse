import { describe, expect, it } from "vitest";
import {
  alertActionHistoryRowMapper,
  alertSavedViewRowMapper,
  attachmentRowMapper,
  batchRowMapper,
  alertRowMapper,
  createPlaceholderAlertActionHistoryRow,
  createPlaceholderAlertSavedViewRow,
  createPlaceholderAttachmentRow,
  createPlaceholderAlertRow,
  createPlaceholderBatchRow,
  createPlaceholderFeedRow,
  createPlaceholderPondRow,
  createPlaceholderPondResponsibilityRow,
  createPlaceholderTaskRow,
  createPlaceholderWaterQualityRow,
  feedRowMapper,
  pondRowMapper,
  taskRowMapper,
  waterQualityRowMapper
} from "../index.js";

describe("Shared AquaPulse row mappers", () => {
  it("maps pond rows into PondSummary", () => {
    const pond = pondRowMapper.toDomain(
      createPlaceholderPondRow({
        id: "pond-77",
        farm_id: "farm-77",
        status: "maintenance"
      })
    );

    expect(pond.id).toBe("pond-77");
    expect(pond.farmId).toBe("farm-77");
    expect(pond.status).toBe("maintenance");
  });

  it("maps alert rows into AlertSummary", () => {
    const alert = alertRowMapper.toDomain(
      createPlaceholderAlertRow({
        id: "alert-77",
        pond_id: "pond-77",
        status: "acknowledged"
      })
    );

    expect(alert.id).toBe("alert-77");
    expect(alert.pondId).toBe("pond-77");
    expect(alert.status).toBe("acknowledged");
  });

  it("maps task, attachment, batch, and feed rows into domain shapes", () => {
    expect(taskRowMapper.toDomain(createPlaceholderTaskRow({ id: "task-77" })).id).toBe("task-77");
    expect(createPlaceholderPondResponsibilityRow({ id: "responsibility-77" }).id).toBe("responsibility-77");
    expect(
      attachmentRowMapper.toDomain(createPlaceholderAttachmentRow({ id: "attachment-77" })).id
    ).toBe("attachment-77");
    expect(batchRowMapper.toDomain(createPlaceholderBatchRow({ id: "batch-77" })).id).toBe("batch-77");
    expect(feedRowMapper.toDomain(createPlaceholderFeedRow({ id: "feed-77" })).id).toBe("feed-77");
  });

  it("maps water-quality, alert history, and saved-view rows into domain shapes", () => {
    expect(waterQualityRowMapper.toDomain(createPlaceholderWaterQualityRow({ id: "wq-77" })).id).toBe("wq-77");
    expect(
      alertActionHistoryRowMapper.toDomain(
        createPlaceholderAlertActionHistoryRow({ id: "history-77", action: "acknowledged" })
      ).action
    ).toBe("acknowledged");
    expect(
      alertSavedViewRowMapper.toDomain(
        createPlaceholderAlertSavedViewRow({ id: "view-77", name: "Saved view 77" })
      ).name
    ).toBe("Saved view 77");
  });
});
