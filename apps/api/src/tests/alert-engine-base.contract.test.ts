import { describe, expect, it } from "vitest";
import { evaluateWaterQualityAlertDecisions } from "@aquapulse/types";
import { AlertsApplicationService } from "../modules/alerts/application/alerts.application-service";
import { InMemoryAlertsRepository } from "../modules/alerts/repositories/in-memory-alerts.repository";

describe("Operational alert engine base", () => {
  it("upserts a single open alert deterministically for repeated threshold breaches", async () => {
    const repository = new InMemoryAlertsRepository();
    const alerts = new AlertsApplicationService(repository);
    const decisions = evaluateWaterQualityAlertDecisions({
      pondId: "pond-1",
      recordedAt: "2026-04-15T07:00:00.000Z",
      temperatureC: 35,
      ph: 9
    });

    await alerts.upsertOperationalDecision(decisions[0]!);
    await alerts.upsertOperationalDecision({
      ...decisions[0]!,
      observedAt: "2026-04-15T07:30:00.000Z"
    });

    const openAlerts = await repository.listOpen();
    const thresholdAlerts = openAlerts.items.filter((item) => item.title === "Water-quality threshold breach");

    expect(thresholdAlerts).toHaveLength(1);
    expect(thresholdAlerts[0]?.source).toBe("water-quality");
  });
});
