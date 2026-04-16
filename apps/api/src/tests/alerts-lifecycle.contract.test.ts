import { describe, expect, it } from "vitest";
import { AlertsApplicationService } from "../modules/alerts/application/alerts.application-service";
import { AlertsController } from "../modules/alerts/alerts.controller";
import { InMemoryAlertsRepository } from "../modules/alerts/repositories/in-memory-alerts.repository";

describe("Alerts lifecycle flow", () => {
  it("acknowledges and resolves alerts through the in-memory repository path", async () => {
    const repository = new InMemoryAlertsRepository();
    const service = new AlertsApplicationService(repository);

    const acknowledged = await service.acknowledge("alert-1", { note: "Operator reviewed pond 1." });
    const resolved = await service.resolve("alert-1", { note: "Issue cleared after retest." });

    expect(acknowledged.data.status).toBe("acknowledged");
    expect(resolved.data.status).toBe("resolved");
    expect(resolved.data.latestNote).toBe("Issue cleared after retest.");
    expect(resolved.data.actionHistory?.map((item) => item.action)).toEqual([
      "created",
      "acknowledged",
      "resolved"
    ]);
  });

  it("keeps controller -> mapper -> service -> envelope delegation stable for lifecycle actions", async () => {
    const repository = new InMemoryAlertsRepository();
    const applicationService = new AlertsApplicationService(repository);
    const controller = new AlertsController(
      { getPlaceholder: async () => ({ ok: true }) } as never,
      applicationService
    );

    const acknowledged = await controller.acknowledge("alert-1", { note: "Checked aerator." });
    const resolved = await controller.resolve("alert-1", { note: "Reading stabilized." });

    expect(acknowledged.ok).toBe(true);
    expect(acknowledged.data.status).toBe("acknowledged");
    expect(resolved.data.status).toBe("resolved");
    expect(resolved.data.latestNote).toBe("Reading stabilized.");
  });

  it("supports review-queue filtering and deterministic ordering", async () => {
    const repository = new InMemoryAlertsRepository();
    const service = new AlertsApplicationService(repository);

    await service.acknowledge("alert-1", { note: "Needs daytime follow-up." });
    await service.create({
      title: "Feed quantity anomaly detected",
      severity: "medium",
      source: "feed",
      pondId: "pond-1",
      status: "open",
      latestNote: "Auto-generated from feed input."
    });

    const acknowledged = await service.list({
      page: 1,
      pageSize: 20,
      status: "acknowledged",
      sortBy: "updatedAt_desc",
      hasLatestNote: true
    });
    const newestCreated = await service.list({
      page: 1,
      pageSize: 20,
      sortBy: "createdAt_desc"
    });

    expect(acknowledged.data.items[0]?.status).toBe("acknowledged");
    expect(acknowledged.data.items[0]?.latestNote).toBeTruthy();
    expect(newestCreated.data.items[0]?.title).toBe("Feed quantity anomaly detected");
  });

  it("supports assignment and review-state transitions with deterministic history", async () => {
    const repository = new InMemoryAlertsRepository();
    const service = new AlertsApplicationService(repository);

    const assigned = await service.assign("alert-1", {
      assignedTo: "operator-1",
      note: "Assigned for triage."
    });
    const reviewed = await service.setReviewState("alert-1", {
      reviewState: "reviewed",
      reviewLabel: "oxygen-check",
      note: "Review completed."
    });
    const unassigned = await service.unassign("alert-1", {
      note: "Returning to general queue."
    });
    const filtered = await service.list({
      page: 1,
      pageSize: 20,
      reviewState: "reviewed",
      sortBy: "updatedAt_desc"
    });

    expect(assigned.data.assignedTo).toBe("operator-1");
    expect(assigned.data.reviewState).toBe("under_review");
    expect(reviewed.data.reviewState).toBe("reviewed");
    expect(reviewed.data.reviewLabel).toBe("oxygen-check");
    expect(unassigned.data.assignedTo).toBeUndefined();
    expect(unassigned.data.actionHistory?.map((item) => item.action)).toEqual([
      "created",
      "assigned",
      "review_state_changed",
      "unassigned"
    ]);
    expect(filtered.data.items[0]?.reviewState).toBe("reviewed");
  });

  it("builds deterministic owner workload counts through the alert summary path", async () => {
    const repository = new InMemoryAlertsRepository();
    const service = new AlertsApplicationService(repository);

    await service.assign("alert-1", {
      assignedTo: "operator-queue",
      note: "Owner set for review queue."
    });
    await service.setReviewState("alert-1", {
      reviewState: "under_review",
      reviewLabel: "queue",
      note: "Moved under review."
    });

    const summary = await service.summary({
      page: 1,
      pageSize: 20,
      sortBy: "updatedAt_desc"
    });

    expect(summary.data.ownerWorkloads).toEqual([
      {
        ownerId: "operator-queue",
        assignedAlerts: 1,
        openAlerts: 1,
        underReviewAlerts: 1,
        unresolvedAlerts: 1
      }
    ]);
  });

  it("supports deterministic bulk lifecycle and review actions", async () => {
    const repository = new InMemoryAlertsRepository();
    const service = new AlertsApplicationService(repository);

    await service.create({
      id: "alert-2",
      title: "Feed issue",
      severity: "medium",
      source: "feed",
      pondId: "pond-1",
      status: "open"
    });

    const acknowledged = await service.bulkAcknowledge({
      alertIds: ["alert-1", "alert-2"],
      note: "Bulk review."
    });
    const reviewed = await service.bulkSetReviewState({
      alertIds: ["alert-1", "alert-2"],
      reviewState: "under_review",
      reviewLabel: "bulk-queue",
      note: "Bulk moved to review."
    });

    expect(acknowledged.data.totalUpdated).toBe(2);
    expect(reviewed.data.updatedAlerts.every((item) => item.reviewState === "under_review")).toBe(true);
    expect(reviewed.data.updatedAlerts.every((item) => item.reviewLabel === "bulk-queue")).toBe(true);
  });
});
