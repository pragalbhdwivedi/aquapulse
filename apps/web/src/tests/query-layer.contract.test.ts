import { beforeEach, describe, expect, it } from "vitest";
import {
  filterAlertsByQuery,
  sortAlertsByQuery
} from "@aquapulse/types";
import {
  aiRepository,
  alertsRepository,
  auditRepository,
  pondsRepository,
  tasksRepository,
  waterQualityRepository
} from "../repositories";
import {
  createReadonlyQueries,
  getAlertsPageData,
  getAuditPageData,
  getDashboardPageData,
  getPondDetailPageData,
  getPondOverviewPageData,
  getPondOverviewPreviewData,
  getPondRecentWaterQualityPageData,
  getPondDetailPagePreviewData,
  getPondsPageData,
  getTaskDetailPageData,
  getReportsPageData
} from "../queries";
import { resetAlertsMockState } from "../mocks/adapters";

describe("Frontend query layer", () => {
  beforeEach(() => {
    resetAlertsMockState();
  });

  it("builds dashboard data without exposing the client implementation", async () => {
    const dashboard = await getDashboardPageData();

    expect(dashboard.ponds.items.length).toBeGreaterThan(0);
    expect(dashboard.alerts.items.length).toBeGreaterThan(0);
    expect(dashboard.alertSummary.totalAlerts).toBeGreaterThan(0);
    expect(dashboard.answer.answer).toContain("Placeholder");
  });

  it("builds pond detail data from repository-backed queries", async () => {
    const pondDetail = await getPondDetailPageData("pond-1");

    expect(pondDetail.pond.id).toBe("pond-1");
    expect(pondDetail.waterQuality.items.length).toBeGreaterThan(0);
    expect(pondDetail.summary.summary).toContain("Placeholder");
  });

  it("builds bounded pond preview data without requiring the protected detail route", async () => {
    const pondDetail = await getPondDetailPagePreviewData("pond-1");

    expect(pondDetail.pond?.id).toBe("pond-1");
    expect(pondDetail.waterQuality.items.length).toBeGreaterThan(0);
    expect(pondDetail.summary.summary).toContain("Placeholder");
  });

  it("keeps bounded pond overview and recent water-quality queries stable as separate read surfaces", async () => {
    const [overview, preview, recent] = await Promise.all([
      getPondOverviewPageData("pond-1"),
      getPondOverviewPreviewData("pond-1"),
      getPondRecentWaterQualityPageData("pond-1")
    ]);

    expect(overview.pond.id).toBe("pond-1");
    expect(preview.pond?.id).toBe("pond-1");
    expect(overview.summary.summary).toContain("Placeholder");
    expect(recent.items.length).toBeGreaterThan(0);
  });

  it("builds task detail data from repository-backed queries", async () => {
    const taskDetail = await getTaskDetailPageData("task-1");

    expect(taskDetail.id).toBe("task-1");
    expect(taskDetail.title).toBeTruthy();
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
    expect(alerts.summary.assignmentCounts.unassigned).toBeGreaterThanOrEqual(0);
    expect(audit.items[0]?.resourceType).toBe("alert");
    expect(reports.handover.summary).toContain("Placeholder");
  });

  it("keeps repository query semantics aligned with normalized backend-style list inputs", async () => {
    const [ponds, alerts, audit, tasks] = await Promise.all([
      pondsRepository.list({ page: 1, pageSize: 5, search: "North" }),
      alertsRepository.list({ page: 1, pageSize: 5, status: "open", sortBy: "updatedAt_desc" }),
      auditRepository.list({ page: 1, pageSize: 5, resourceType: "alert" }),
      tasksRepository.list({ page: 1, pageSize: 5, status: "todo" })
    ]);

    expect(ponds.data.page.pageSize).toBe(5);
    expect(alerts.data.items[0]?.status).toBe("open");
    expect(audit.data.items[0]?.resourceType).toBe("alert");
    expect(tasks.data.items[0]?.status).toBe("todo");
  });

  it("keeps list/detail/query helpers stable when repositories return empty filtered results", async () => {
    const ponds = await pondsRepository.list({ page: 5, pageSize: 30, search: "not-found" });
    const alerts = await alertsRepository.list({ page: 2, pageSize: 15, search: "not-found", hasLatestNote: true });

    expect(ponds.data.items).toHaveLength(0);
    expect(ponds.data.page.page).toBe(5);
    expect(ponds.data.page.pageSize).toBe(30);
    expect(alerts.data.items).toHaveLength(0);
    expect(alerts.data.page.page).toBe(2);
  });

  it("accepts review-queue style alert filters through the shared query path", async () => {
    const alerts = await getAlertsPageData({
      page: 1,
      pageSize: 20,
      status: "open",
      hasLatestNote: true,
      sortBy: "updatedAt_desc"
    });

    expect(alerts.alerts.page.page).toBe(1);
    expect(alerts.alerts.items.every((item) => item.status === "open")).toBe(true);
  });

  it("keeps alert queue summary counts stable through repository-backed queries", async () => {
    await alertsRepository.assign("alert-1", { assignedTo: "operator-queue", note: "Queue owner set." });
    await alertsRepository.setReviewState("alert-1", {
      reviewState: "under_review",
      reviewLabel: "queue-check",
      note: "Queue moved under review."
    });

    const alerts = await getAlertsPageData({
      page: 1,
      pageSize: 20,
      assignedTo: "operator-queue",
      sortBy: "updatedAt_desc"
    });

    expect(alerts.summary.assignmentCounts.assigned).toBeGreaterThanOrEqual(1);
    expect(alerts.summary.reviewStateCounts.underReview).toBeGreaterThanOrEqual(1);
  });

  it("falls back to a queue-derived alerts summary when the protected summary read is unavailable", async () => {
    const queries = createReadonlyQueries({
      ponds: pondsRepository,
      alerts: {
        ...alertsRepository,
        async summary() {
          throw new Error("HTTP_401");
        }
      },
      tasks: tasksRepository,
      ai: aiRepository,
      waterQuality: waterQualityRepository
    });

    const alerts = await queries.getAlertsPageData({
      page: 1,
      pageSize: 20,
      status: "open",
      sortBy: "updatedAt_desc"
    });

    expect(alerts.summarySource).toBe("fallback");
    expect(alerts.summary.totalAlerts).toBe(alerts.alerts.items.length);
  });

  it("keeps owner workload counts and preset-style filters stable through the shared queue query path", async () => {
    await alertsRepository.assign("alert-1", {
      assignedTo: "operator-queue",
      note: "Preset queue owner."
    });
    await alertsRepository.setReviewState("alert-1", {
      reviewState: "under_review",
      reviewLabel: "queue",
      note: "Preset queue review."
    });

    const alerts = await getAlertsPageData({
      page: 1,
      pageSize: 20,
      assignedTo: "operator-queue",
      sortBy: "updatedAt_desc"
    });

    expect(alerts.alerts.items.every((item) => item.assignedTo === "operator-queue")).toBe(true);
    expect(alerts.summary.ownerWorkloads).toContainEqual({
      ownerId: "operator-queue",
      assignedAlerts: 1,
      openAlerts: 1,
      underReviewAlerts: 1,
      unresolvedAlerts: 1
    });
  });

  it("keeps shared alert filter and descending sort semantics aligned with SQL-style expectations", () => {
    const alerts = [
      {
        id: "alert-a",
        createdAt: "2026-04-16T09:00:00.000Z",
        updatedAt: "2026-04-16T09:05:00.000Z",
        title: "Alpha oxygen warning",
        severity: "high" as const,
        source: "water-quality",
        pondId: "pond-1",
        status: "open" as const,
        reviewState: "unreviewed" as const,
        latestNote: undefined
      },
      {
        id: "alert-b",
        createdAt: "2026-04-16T09:00:00.000Z",
        updatedAt: "2026-04-16T09:05:00.000Z",
        title: "Beta feeding note",
        severity: "medium" as const,
        source: "feed",
        pondId: "pond-1",
        status: "open" as const,
        reviewState: "unreviewed" as const,
        latestNote: "Manual oxygen follow-up required"
      }
    ];

    expect(filterAlertsByQuery(alerts, { search: "oxygen" }).map((item) => item.id)).toEqual([
      "alert-a",
      "alert-b"
    ]);
    expect(filterAlertsByQuery(alerts, { hasLatestNote: true }).map((item) => item.id)).toEqual([
      "alert-b"
    ]);
    expect(sortAlertsByQuery(alerts, "updatedAt_desc").map((item) => item.id)).toEqual([
      "alert-b",
      "alert-a"
    ]);
    expect(sortAlertsByQuery(alerts, "createdAt_desc").map((item) => item.id)).toEqual([
      "alert-b",
      "alert-a"
    ]);
  });
});
