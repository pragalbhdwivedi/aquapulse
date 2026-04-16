import { describe, expect, it } from "vitest";
import { createRepositories, createRepositoriesFromConfig } from "../repositories";
import { createMockApiClients } from "../clients";
import { createAlertLifecycleSubmitter, submitAlertLifecycleAction } from "../features/alert-lifecycle";
import {
  createAlertAssignSubmitter,
  createAlertReviewStateSubmitter,
  createAlertUnassignSubmitter,
  submitAlertTriageAction
} from "../features/alert-triage";

describe("Alerts lifecycle flow", () => {
  it("supports acknowledge and resolve through the default mock-backed repository path", async () => {
    const repositories = createRepositories(createMockApiClients());
    const acknowledge = createAlertLifecycleSubmitter(repositories, "acknowledge")("alert-1");
    const resolve = createAlertLifecycleSubmitter(repositories, "resolve")("alert-1");

    const acknowledged = await acknowledge({ note: "Checked dissolved oxygen meter." });
    const resolved = await resolve({ note: "Values back in range." });

    expect(acknowledged.status).toBe("success");
    expect(resolved.status).toBe("success");
    if (acknowledged.status === "success" && resolved.status === "success") {
      expect(acknowledged.data.status).toBe("acknowledged");
      expect(resolved.data.status).toBe("resolved");
      expect(resolved.data.latestNote).toBe("Values back in range.");
      expect(resolved.data.actionHistory?.map((item) => item.action)).toEqual([
        "created",
        "acknowledged",
        "resolved"
      ]);
      expect(resolved.refreshedList?.items.find((item) => item.id === "alert-1")?.status).toBe("resolved");
    }
  });

  it("supports lifecycle actions through placeholder-http runtime", async () => {
    const repositories = createRepositoriesFromConfig({
      mode: "http",
      enablePlaceholderHttp: true
    });

    const acknowledged = await repositories.alerts.acknowledge("alert-1", { note: "Reviewed in HTTP mode." });
    const resolved = await repositories.alerts.resolve("alert-1", { note: "Closed in HTTP mode." });

    expect(acknowledged.data.status).toBe("acknowledged");
    expect(resolved.data.status).toBe("resolved");
    expect(resolved.data.actionHistory?.at(-1)?.note).toBe("Closed in HTTP mode.");
  });

  it("keeps the public submit helper stable", async () => {
    const result = await submitAlertLifecycleAction("acknowledge", "alert-1", {
      note: "Operator follow-up."
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.status).toBe("acknowledged");
      expect(result.data.latestNote).toBe("Operator follow-up.");
    }
  });

  it("supports review-queue filtering and sorting through the frontend repository path", async () => {
    const repositories = createRepositories(createMockApiClients());

    await repositories.alerts.acknowledge("alert-1", { note: "Queue review note." });
    await repositories.feed.create({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Emergency Feed",
      quantityKg: 95,
      fedAt: "2026-04-15T11:00:00.000Z"
    });

    const acknowledged = await repositories.alerts.list({
      page: 1,
      pageSize: 20,
      status: "acknowledged",
      hasLatestNote: true,
      sortBy: "updatedAt_desc"
    });
    const newest = await repositories.alerts.list({
      page: 1,
      pageSize: 20,
      sortBy: "createdAt_desc"
    });

    expect(acknowledged.data.items[0]?.status).toBe("acknowledged");
    expect(acknowledged.data.items[0]?.latestNote).toBeTruthy();
    expect(newest.data.items[0]?.updatedAt >= newest.data.items.at(-1)?.updatedAt!).toBe(true);
  });

  it("supports assignment and review-state actions through mock-backed and placeholder-http paths", async () => {
    const repositories = createRepositories(createMockApiClients());
    const assign = createAlertAssignSubmitter(repositories)("alert-1");
    const setReviewState = createAlertReviewStateSubmitter(repositories)("alert-1");
    const unassign = createAlertUnassignSubmitter(repositories)("alert-1");

    const assigned = await assign({ assignedTo: "operator-1", note: "Owner set." });
    const reviewed = await setReviewState({
      reviewState: "reviewed",
      reviewLabel: "oxygen-check",
      note: "Reviewed."
    });
    const unassigned = await unassign({ note: "Released." });

    expect(assigned.status).toBe("success");
    expect(reviewed.status).toBe("success");
    expect(unassigned.status).toBe("success");
    if (assigned.status === "success" && reviewed.status === "success" && unassigned.status === "success") {
      expect(assigned.data.assignedTo).toBe("operator-1");
      expect(reviewed.data.reviewState).toBe("reviewed");
      expect(reviewed.data.reviewLabel).toBe("oxygen-check");
      expect(unassigned.data.assignedTo).toBeUndefined();
      expect(unassigned.data.actionHistory?.map((item) => item.action)).toContain("review_state_changed");
    }

    const httpRepositories = createRepositoriesFromConfig({
      mode: "http",
      enablePlaceholderHttp: true
    });
    const httpAssigned = await httpRepositories.alerts.assign("alert-1", {
      assignedTo: "operator-http",
      note: "HTTP owner set."
    });
    const httpReviewed = await httpRepositories.alerts.setReviewState("alert-1", {
      reviewState: "under_review",
      reviewLabel: "http-queue",
      note: "HTTP review state."
    });

    expect(httpAssigned.data.assignedTo).toBe("operator-http");
    expect(httpReviewed.data.reviewState).toBe("under_review");
    expect(httpReviewed.data.actionHistory?.at(-1)?.reviewLabel).toBe("http-queue");
    const summary = await httpRepositories.alerts.summary({ page: 1, pageSize: 20 });
    expect(summary.data.assignmentCounts.assigned).toBeGreaterThanOrEqual(1);
    expect(summary.data.ownerWorkloads.some((item) => item.ownerId === "operator-http")).toBe(true);
  });

  it("keeps the public triage submit helper stable", async () => {
    const result = await submitAlertTriageAction("assign", "alert-1", {
      assignedTo: "operator-2",
      note: "Taking ownership."
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.assignedTo).toBe("operator-2");
      expect(result.data.reviewState).toBe("under_review");
    }
  });

  it("supports bulk queue actions through mock-backed and placeholder-http repositories", async () => {
    const repositories = createRepositories(createMockApiClients());
    await repositories.alerts.bulkAssign({
      alertIds: ["alert-1"],
      assignedTo: "operator-bulk",
      note: "Bulk assignment."
    });
    const bulkReviewed = await repositories.alerts.bulkSetReviewState({
      alertIds: ["alert-1"],
      reviewState: "under_review",
      reviewLabel: "bulk-queue",
      note: "Bulk review."
    });

    expect(bulkReviewed.data.totalUpdated).toBe(1);
    expect(bulkReviewed.data.updatedAlerts[0]?.reviewLabel).toBe("bulk-queue");

    const httpRepositories = createRepositoriesFromConfig({
      mode: "http",
      enablePlaceholderHttp: true
    });
    const bulkAcknowledged = await httpRepositories.alerts.bulkAcknowledge({
      alertIds: ["alert-1"],
      note: "HTTP bulk acknowledge."
    });

    expect(bulkAcknowledged.data.totalUpdated).toBe(1);
    expect(bulkAcknowledged.data.updatedAlerts[0]?.status).toBe("acknowledged");
  });
});
