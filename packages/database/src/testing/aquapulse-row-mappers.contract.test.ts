import { describe, expect, it } from "vitest";
import {
  alertRowMapper,
  createPlaceholderAlertRow,
  createPlaceholderPondRow,
  pondRowMapper
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
});
