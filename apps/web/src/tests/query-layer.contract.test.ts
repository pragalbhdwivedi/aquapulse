import { describe, expect, it } from "vitest";
import {
  getAlertsPageData,
  getAuditPageData,
  getDashboardPageData,
  getPondDetailPageData,
  getPondsPageData,
  getReportsPageData
} from "../queries";

describe("Frontend query layer", () => {
  it("builds dashboard data without exposing the client implementation", async () => {
    const dashboard = await getDashboardPageData();

    expect(dashboard.ponds.items.length).toBeGreaterThan(0);
    expect(dashboard.alerts.items.length).toBeGreaterThan(0);
    expect(dashboard.answer.answer).toContain("Placeholder");
  });

  it("builds pond detail data from repository-backed queries", async () => {
    const pondDetail = await getPondDetailPageData("pond-1");

    expect(pondDetail.pond.id).toBe("pond-1");
    expect(pondDetail.waterQuality.items.length).toBeGreaterThan(0);
    expect(pondDetail.summary.summary).toContain("Placeholder");
  });

  it("keeps alert, audit, pond, and report queries stable", async () => {
    const [ponds, alerts, audit, reports] = await Promise.all([
      getPondsPageData(),
      getAlertsPageData(),
      getAuditPageData(),
      getReportsPageData()
    ]);

    expect(ponds.items[0]?.code).toBe("NP-01");
    expect(alerts.explanation).toContain("Placeholder");
    expect(audit.items[0]?.resourceType).toBe("alert");
    expect(reports.handover.summary).toContain("Placeholder");
  });
});
