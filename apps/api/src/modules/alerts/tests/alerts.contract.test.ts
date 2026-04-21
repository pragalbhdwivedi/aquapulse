import { describe, expect, it, vi } from "vitest";
import type { AlertQueueSummary, AlertSummary, ListResponse } from "@aquapulse/types";
import { QueryAlertsDto } from "../dto";
import { toAlertsItemResponse, toAlertsListResponse } from "../mappers/alerts.mapper";
import type { AlertsRepositoryPort } from "../ports/alerts-repository.port";
import { AlertsApplicationService } from "../application/alerts.application-service";
import { AlertsController } from "../alerts.controller";
import type { AlertsLiveUpdatesService } from "../live-updates/alerts-live-updates.service";

const alert: AlertSummary = {
  id: "alert-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  title: "Low dissolved oxygen warning",
  severity: "high",
  source: "water-quality",
  pondId: "pond-1",
  status: "open"
};

const alertList: ListResponse<AlertSummary> = {
  items: [alert],
  page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
};

const alertSummary: AlertQueueSummary = {
  totalAlerts: 1,
  statusCounts: { open: 1, acknowledged: 0, resolved: 0 },
  assignmentCounts: { assigned: 0, unassigned: 1 },
  reviewStateCounts: { unreviewed: 1, underReview: 0, reviewed: 0, deferred: 0 },
  noteCounts: { withLatestNote: 0, withoutLatestNote: 1 },
  severityCounts: { low: 0, medium: 0, high: 1, critical: 0 },
  ownerWorkloads: []
};

describe("Alerts contracts", () => {
  it("application service uses the alerts repository port", async () => {
    const repository: AlertsRepositoryPort = {
      create: vi.fn().mockResolvedValue(alert),
      update: vi.fn().mockResolvedValue(alert),
      acknowledge: vi.fn().mockResolvedValue(alert),
      bulkAcknowledge: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      resolve: vi.fn().mockResolvedValue(alert),
      bulkResolve: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      assign: vi.fn().mockResolvedValue({ ...alert, assignedTo: "user-2", reviewState: "under_review" as const }),
      bulkAssign: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      unassign: vi.fn().mockResolvedValue({ ...alert, assignedTo: undefined }),
      setReviewState: vi.fn().mockResolvedValue({ ...alert, reviewState: "reviewed" as const }),
      bulkSetReviewState: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      getById: vi.fn().mockResolvedValue(alert),
      list: vi.fn().mockResolvedValue(alertList),
      summary: vi.fn().mockResolvedValue(alertSummary),
      listOpen: vi.fn().mockResolvedValue(alertList),
      listSavedViews: vi.fn().mockResolvedValue([]),
      saveSavedView: vi.fn().mockResolvedValue([]),
      removeSavedView: vi.fn().mockResolvedValue([]),
      attachExplanation: vi.fn().mockResolvedValue(alert)
    };

    const emit = vi.fn();
    const service = new AlertsApplicationService(repository, {
      emit
    } as unknown as AlertsLiveUpdatesService);
    const result = await service.getById("alert-1");

    expect(repository.getById).toHaveBeenCalledWith("alert-1");
    expect(result.data.status).toBe("open");
  });

  it("application service delegates lifecycle actions to the alerts repository port", async () => {
    const repository: AlertsRepositoryPort = {
      create: vi.fn().mockResolvedValue(alert),
      update: vi.fn().mockResolvedValue(alert),
      acknowledge: vi.fn().mockResolvedValue({ ...alert, status: "acknowledged" as const }),
      bulkAcknowledge: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      resolve: vi.fn().mockResolvedValue({ ...alert, status: "resolved" as const }),
      bulkResolve: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      assign: vi.fn().mockResolvedValue({ ...alert, assignedTo: "user-2", reviewState: "under_review" as const }),
      bulkAssign: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      unassign: vi.fn().mockResolvedValue({ ...alert, assignedTo: undefined }),
      setReviewState: vi.fn().mockResolvedValue({ ...alert, reviewState: "reviewed" as const }),
      bulkSetReviewState: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      getById: vi.fn().mockResolvedValue(alert),
      list: vi.fn().mockResolvedValue(alertList),
      summary: vi.fn().mockResolvedValue(alertSummary),
      listOpen: vi.fn().mockResolvedValue(alertList),
      listSavedViews: vi.fn().mockResolvedValue([]),
      saveSavedView: vi.fn().mockResolvedValue([]),
      removeSavedView: vi.fn().mockResolvedValue([]),
      attachExplanation: vi.fn().mockResolvedValue(alert)
    };

    const emit = vi.fn();
    const service = new AlertsApplicationService(repository, {
      emit
    } as unknown as AlertsLiveUpdatesService);
    const acknowledged = await service.acknowledge("alert-1", { note: "Checked sensor." });
    const resolved = await service.resolve("alert-1", { note: "Restored." });

    expect(repository.acknowledge).toHaveBeenCalledWith("alert-1", { note: "Checked sensor." });
    expect(repository.resolve).toHaveBeenCalledWith("alert-1", { note: "Restored." });
    expect(acknowledged.data.status).toBe("acknowledged");
    expect(resolved.data.status).toBe("resolved");
  });

  it("application service delegates triage actions to the alerts repository port", async () => {
    const repository: AlertsRepositoryPort = {
      create: vi.fn().mockResolvedValue(alert),
      update: vi.fn().mockResolvedValue(alert),
      acknowledge: vi.fn().mockResolvedValue(alert),
      bulkAcknowledge: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      resolve: vi.fn().mockResolvedValue(alert),
      bulkResolve: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      assign: vi.fn().mockResolvedValue({ ...alert, assignedTo: "user-2", reviewState: "under_review" as const }),
      bulkAssign: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      unassign: vi.fn().mockResolvedValue({ ...alert, assignedTo: undefined }),
      setReviewState: vi.fn().mockResolvedValue({ ...alert, reviewState: "reviewed" as const, reviewLabel: "operator-review" }),
      bulkSetReviewState: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      getById: vi.fn().mockResolvedValue(alert),
      list: vi.fn().mockResolvedValue(alertList),
      summary: vi.fn().mockResolvedValue(alertSummary),
      listOpen: vi.fn().mockResolvedValue(alertList),
      listSavedViews: vi.fn().mockResolvedValue([]),
      saveSavedView: vi.fn().mockResolvedValue([]),
      removeSavedView: vi.fn().mockResolvedValue([]),
      attachExplanation: vi.fn().mockResolvedValue(alert)
    };

    const emit = vi.fn();
    const service = new AlertsApplicationService(repository, {
      emit
    } as unknown as AlertsLiveUpdatesService);
    const assigned = await service.assign("alert-1", { assignedTo: "user-2", note: "Picked up for review." });
    const reviewState = await service.setReviewState("alert-1", {
      reviewState: "reviewed",
      reviewLabel: "operator-review",
      note: "Completed review."
    });
    const unassigned = await service.unassign("alert-1", { note: "Returned to queue." });

    expect(repository.assign).toHaveBeenCalledWith("alert-1", { assignedTo: "user-2", note: "Picked up for review." });
    expect(repository.setReviewState).toHaveBeenCalledWith("alert-1", {
      reviewState: "reviewed",
      reviewLabel: "operator-review",
      note: "Completed review."
    });
    expect(repository.unassign).toHaveBeenCalledWith("alert-1", { note: "Returned to queue." });
    expect(assigned.data.assignedTo).toBe("user-2");
    expect(reviewState.data.reviewState).toBe("reviewed");
    expect(unassigned.data.assignedTo).toBeUndefined();
  });

  it("application service delegates summary reads to the alerts repository port", async () => {
    const repository: AlertsRepositoryPort = {
      create: vi.fn().mockResolvedValue(alert),
      update: vi.fn().mockResolvedValue(alert),
      acknowledge: vi.fn().mockResolvedValue(alert),
      bulkAcknowledge: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      resolve: vi.fn().mockResolvedValue(alert),
      bulkResolve: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      assign: vi.fn().mockResolvedValue(alert),
      bulkAssign: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      unassign: vi.fn().mockResolvedValue(alert),
      setReviewState: vi.fn().mockResolvedValue(alert),
      bulkSetReviewState: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      getById: vi.fn().mockResolvedValue(alert),
      list: vi.fn().mockResolvedValue(alertList),
      summary: vi.fn().mockResolvedValue(alertSummary),
      listOpen: vi.fn().mockResolvedValue(alertList),
      listSavedViews: vi.fn().mockResolvedValue([]),
      saveSavedView: vi.fn().mockResolvedValue([]),
      removeSavedView: vi.fn().mockResolvedValue([]),
      attachExplanation: vi.fn().mockResolvedValue(alert)
    };

    const emit = vi.fn();
    const service = new AlertsApplicationService(repository, {
      emit
    } as unknown as AlertsLiveUpdatesService);
    const result = await service.summary({ page: 1, pageSize: 20 });

    expect(repository.summary).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    expect(result.data.assignmentCounts.unassigned).toBe(1);
    expect(result.data.statusCounts.open).toBe(1);
  });

  it("controller returns a standard item envelope", async () => {
    const placeholderService = { getPlaceholder: vi.fn().mockResolvedValue({ ok: true }) };
    const appService = {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn(),
      summary: vi.fn().mockResolvedValue({ ok: true, data: alertSummary }),
      getById: vi.fn().mockResolvedValue({ ok: true, data: alert })
    };

    const controller = new AlertsController(placeholderService as never, appService as never);
    const response = await controller.getById("alert-1");

    expect(response.ok).toBe(true);
    expect(response.data.severity).toBe("high");
  });

  it("application service delegates bulk actions to the alerts repository port", async () => {
    const repository: AlertsRepositoryPort = {
      create: vi.fn().mockResolvedValue(alert),
      update: vi.fn().mockResolvedValue(alert),
      acknowledge: vi.fn().mockResolvedValue(alert),
      bulkAcknowledge: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      resolve: vi.fn().mockResolvedValue(alert),
      bulkResolve: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      assign: vi.fn().mockResolvedValue(alert),
      bulkAssign: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      unassign: vi.fn().mockResolvedValue(alert),
      setReviewState: vi.fn().mockResolvedValue(alert),
      bulkSetReviewState: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      getById: vi.fn().mockResolvedValue(alert),
      list: vi.fn().mockResolvedValue(alertList),
      summary: vi.fn().mockResolvedValue(alertSummary),
      listOpen: vi.fn().mockResolvedValue(alertList),
      listSavedViews: vi.fn().mockResolvedValue([]),
      saveSavedView: vi.fn().mockResolvedValue([]),
      removeSavedView: vi.fn().mockResolvedValue([]),
      attachExplanation: vi.fn().mockResolvedValue(alert)
    };

    const service = new AlertsApplicationService(repository, {
      emit: vi.fn()
    } as unknown as AlertsLiveUpdatesService);
    const acknowledged = await service.bulkAcknowledge({ alertIds: ["alert-1"], note: "Bulk acknowledge." });
    const assigned = await service.bulkAssign({ alertIds: ["alert-1"], assignedTo: "operator-1", note: "Bulk assign." });

    expect(repository.bulkAcknowledge).toHaveBeenCalledWith({ alertIds: ["alert-1"], note: "Bulk acknowledge." });
    expect(repository.bulkAssign).toHaveBeenCalledWith({ alertIds: ["alert-1"], assignedTo: "operator-1", note: "Bulk assign." });
    expect(acknowledged.data.totalUpdated).toBe(1);
    expect(assigned.data.totalUpdated).toBe(1);
  });

  it("application service delegates saved-view actions to the alerts repository port", async () => {
    const savedViews = [
      {
        id: "alert-view-1",
        name: "Open queue",
        presetId: "all_open" as const,
        query: { page: 1, pageSize: 20, status: "open" as const },
        createdAt: "2026-04-15T10:35:00.000Z",
        updatedAt: "2026-04-15T10:35:00.000Z"
      }
    ];
    const repository: AlertsRepositoryPort = {
      create: vi.fn().mockResolvedValue(alert),
      update: vi.fn().mockResolvedValue(alert),
      acknowledge: vi.fn().mockResolvedValue(alert),
      bulkAcknowledge: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      resolve: vi.fn().mockResolvedValue(alert),
      bulkResolve: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      assign: vi.fn().mockResolvedValue(alert),
      bulkAssign: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      unassign: vi.fn().mockResolvedValue(alert),
      setReviewState: vi.fn().mockResolvedValue(alert),
      bulkSetReviewState: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      listSavedViews: vi.fn().mockResolvedValue(savedViews),
      saveSavedView: vi.fn().mockResolvedValue(savedViews),
      removeSavedView: vi.fn().mockResolvedValue([]),
      attachExplanation: vi.fn().mockResolvedValue(alert),
      getById: vi.fn().mockResolvedValue(alert),
      list: vi.fn().mockResolvedValue(alertList),
      summary: vi.fn().mockResolvedValue(alertSummary),
      listOpen: vi.fn().mockResolvedValue(alertList)
    };

    const emit = vi.fn();
    const service = new AlertsApplicationService(repository, {
      emit
    } as unknown as AlertsLiveUpdatesService);
    const listed = await service.listSavedViews();
    const saved = await service.saveSavedView({
      name: "Open queue",
      presetId: "all_open",
      query: { page: 1, pageSize: 20, status: "open" }
    });
    const removed = await service.removeSavedView("alert-view-1");

    expect(repository.listSavedViews).toHaveBeenCalled();
    expect(repository.saveSavedView).toHaveBeenCalledWith({
      name: "Open queue",
      presetId: "all_open",
      query: { page: 1, pageSize: 20, status: "open" }
    });
    expect(repository.removeSavedView).toHaveBeenCalledWith("alert-view-1");
    expect(listed.data[0]?.name).toBe("Open queue");
    expect(saved.data).toHaveLength(1);
    expect(removed.data).toHaveLength(0);
  });

  it("mapper keeps alert response shapes consistent", () => {
    expect(toAlertsItemResponse(alert).data.source).toBe("water-quality");
    expect(toAlertsListResponse(alertList).data.items[0]?.title).toContain("oxygen");
  });

  it("application service delegates explanation attachment to the alerts repository port", async () => {
    const repository: AlertsRepositoryPort = {
      create: vi.fn().mockResolvedValue(alert),
      update: vi.fn().mockResolvedValue(alert),
      acknowledge: vi.fn().mockResolvedValue(alert),
      bulkAcknowledge: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      resolve: vi.fn().mockResolvedValue(alert),
      bulkResolve: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      assign: vi.fn().mockResolvedValue(alert),
      bulkAssign: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      unassign: vi.fn().mockResolvedValue(alert),
      setReviewState: vi.fn().mockResolvedValue(alert),
      bulkSetReviewState: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      attachExplanation: vi.fn().mockResolvedValue({
        ...alert,
        latestNote: "AI explanation snapshot",
        actionHistory: [
          ...(alert.actionHistory ?? []),
          {
            action: "ai_explanation_snapshot",
            note: "AI explanation snapshot",
            timestamp: "2026-04-16T10:00:00.000Z"
          }
        ]
      }),
      listSavedViews: vi.fn().mockResolvedValue([]),
      saveSavedView: vi.fn().mockResolvedValue([]),
      removeSavedView: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(alert),
      list: vi.fn().mockResolvedValue(alertList),
      summary: vi.fn().mockResolvedValue(alertSummary),
      listOpen: vi.fn().mockResolvedValue(alertList)
    };

    const emit = vi.fn();
    const service = new AlertsApplicationService(repository, {
      emit
    } as unknown as AlertsLiveUpdatesService);
    const result = await service.attachExplanation("alert-1", {
      explanation: {
        summary: "Alert explanation summary",
        explanation: "Alert explanation body",
        recommendations: ["Inspect aeration equipment."],
        likelyCauses: [],
        recommendedChecks: [],
        suggestedActions: [],
        confidenceNote: "Limited confidence.",
        advisoryDisclaimer: "Advisory only.",
        metadata: {
          mode: "fallback",
          advisoryOnly: true,
          generatedAt: "2026-04-16T10:00:00.000Z",
          modelLabel: "gpt-5-nano",
          sourceLabel: "test",
          usedLiveOpenAi: false
        },
        cache: {
          status: "fresh",
          cachedAt: "2026-04-16T10:00:00.000Z",
          freshness: "fresh",
          explanationVersion: "v1",
          generation: "fresh_fallback"
        }
      }
    });

    expect(repository.attachExplanation).toHaveBeenCalledWith(
      "alert-1",
      expect.objectContaining({
        explanation: expect.objectContaining({
          summary: "Alert explanation summary"
        })
      })
    );
    expect(result.data.actionHistory?.at(-1)?.action).toBe("ai_explanation_snapshot");
    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "alerts",
        eventType: "alert_updated",
        alertId: "alert-1",
        changedFields: ["latestNote", "actionHistory"],
        summary: alertSummary
      })
    );
  });

  it("emits bounded live-update events after lifecycle and bulk mutations", async () => {
    const repository: AlertsRepositoryPort = {
      create: vi.fn().mockResolvedValue(alert),
      update: vi.fn().mockResolvedValue(alert),
      acknowledge: vi.fn().mockResolvedValue({ ...alert, status: "acknowledged" as const }),
      bulkAcknowledge: vi.fn().mockResolvedValue({
        updatedAlerts: [{ ...alert, status: "acknowledged" as const }],
        totalRequested: 1,
        totalUpdated: 1
      }),
      resolve: vi.fn().mockResolvedValue(alert),
      bulkResolve: vi.fn().mockResolvedValue({
        updatedAlerts: [alert],
        totalRequested: 1,
        totalUpdated: 1
      }),
      assign: vi.fn().mockResolvedValue(alert),
      bulkAssign: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      unassign: vi.fn().mockResolvedValue(alert),
      setReviewState: vi.fn().mockResolvedValue(alert),
      bulkSetReviewState: vi.fn().mockResolvedValue({ updatedAlerts: [alert], totalRequested: 1, totalUpdated: 1 }),
      listSavedViews: vi.fn().mockResolvedValue([]),
      saveSavedView: vi.fn().mockResolvedValue([]),
      removeSavedView: vi.fn().mockResolvedValue([]),
      attachExplanation: vi.fn().mockResolvedValue(alert),
      getById: vi.fn().mockResolvedValue(alert),
      list: vi.fn().mockResolvedValue(alertList),
      summary: vi.fn().mockResolvedValue(alertSummary),
      listOpen: vi.fn().mockResolvedValue(alertList)
    };
    const emit = vi.fn();
    const service = new AlertsApplicationService(repository, {
      emit
    } as unknown as AlertsLiveUpdatesService);

    await service.acknowledge("alert-1", { note: "Checked sensor." });
    await service.bulkAcknowledge({ alertIds: ["alert-1"], note: "Bulk note." });

    expect(emit).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        source: "alerts",
        eventType: "alert_lifecycle_changed",
        alertId: "alert-1",
        changedFields: ["status", "latestNote"],
        summary: alertSummary
      })
    );
    expect(emit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        source: "alerts",
        eventType: "alert_bulk_action_completed",
        alertIds: ["alert-1"],
        totalUpdated: 1,
        changedFields: ["status", "latestNote"],
        summary: alertSummary
      })
    );
  });
});
