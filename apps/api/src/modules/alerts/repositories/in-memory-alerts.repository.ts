import { Injectable } from "@nestjs/common";
import type {
  AlertAssignActionRequest,
  AlertActionHistoryItem,
  AlertBulkActionResult,
  AlertBulkAssignActionRequest,
  AlertBulkLifecycleActionRequest,
  AlertBulkReviewStateActionRequest,
  AlertLifecycleActionRequest,
  AlertQueueSummary,
  AlertReviewStateActionRequest,
  AlertSummary,
  AlertUnassignActionRequest,
  ListResponse
} from "@aquapulse/types";
import {
  buildAlertQueueSummary as summarizeAlertQueue,
  filterAlertsByQuery,
  sortAlertsByQuery
} from "@aquapulse/types";
import type { CreateAlertsDto, UpdateAlertsDto } from "../dto";
import type { AlertsRepositoryPort } from "../ports/alerts-repository.port";
import type { AlertsListQueryContract } from "../query-contracts/alerts-query.contract";

const alert: AlertSummary = {
  id: "alert-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  title: "Low dissolved oxygen warning",
  severity: "high",
  source: "water-quality",
  pondId: "pond-1",
  status: "open",
  reviewState: "unreviewed",
  actionHistory: [
    {
      action: "created",
      timestamp: "2026-04-13T00:00:00.000Z"
    }
  ]
};

const alertStore = new WeakMap<InMemoryAlertsRepository, AlertSummary[]>();

function getAlerts(repository: InMemoryAlertsRepository): AlertSummary[] {
  return alertStore.get(repository) ?? [alert];
}

function createPage(items: AlertSummary[], page = 1, pageSize = 20): ListResponse<AlertSummary> {
  return {
    items,
    page: {
      page,
      pageSize,
      totalItems: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize))
    }
  };
}

function applyAlertMutation(
  repository: InMemoryAlertsRepository,
  id: string,
  patch: Partial<AlertSummary>,
  actionHistoryItem: AlertActionHistoryItem | undefined,
  updatedAt: string
): AlertSummary {
  const alerts = getAlerts(repository);
  const current = alerts.find((item) => item.id === id) ?? alerts[0];
  const updated: AlertSummary = {
    ...current,
    ...patch,
    latestNote: actionHistoryItem?.note ?? patch.latestNote ?? current.latestNote,
    actionHistory: actionHistoryItem
      ? [...(current.actionHistory ?? []), actionHistoryItem]
      : current.actionHistory,
    updatedAt
  };
  const index = alerts.findIndex((item) => item.id === id);
  if (index >= 0) {
    alerts[index] = updated;
  } else {
    alerts.push(updated);
  }
  return updated;
}

@Injectable()
export class InMemoryAlertsRepository implements AlertsRepositoryPort {
  constructor() {
    alertStore.set(this, [alert]);
  }

  async create(input: CreateAlertsDto): Promise<AlertSummary> {
    const alerts = getAlerts(this);
    const created: AlertSummary = {
      id: input.id ?? `alert-${alerts.length + 1}`,
      createdAt: "2026-04-15T10:00:00.000Z",
      updatedAt: "2026-04-15T10:00:00.000Z",
      title: input.title ?? "Operational alert",
      severity: input.severity ?? "medium",
      source: input.source ?? "system",
      pondId: input.pondId,
      status: input.status ?? "open",
      assignedTo: input.assignedTo,
      reviewState: input.reviewState ?? "unreviewed",
      reviewLabel: input.reviewLabel,
      actionHistory: [
        {
          action: "created",
          note: input.latestNote,
          timestamp: "2026-04-15T10:00:00.000Z"
        }
      ],
      latestNote: input.latestNote
    };
    alerts.push(created);
    return created;
  }

  async update(id: string, input: UpdateAlertsDto): Promise<AlertSummary> {
    return applyAlertMutation(this, id, input, undefined, "2026-04-15T10:05:00.000Z");
  }

  async acknowledge(id: string, input: AlertLifecycleActionRequest): Promise<AlertSummary> {
    return applyAlertMutation(
      this,
      id,
      { status: "acknowledged" },
      {
        action: "acknowledged",
        note: input.note,
        timestamp: "2026-04-15T10:10:00.000Z"
      },
      "2026-04-15T10:10:00.000Z"
    );
  }

  async bulkAcknowledge(input: AlertBulkLifecycleActionRequest): Promise<AlertBulkActionResult> {
    const updatedAlerts = await Promise.all(
      input.alertIds.map((alertId) => this.acknowledge(alertId, { note: input.note }))
    );

    return {
      updatedAlerts,
      totalRequested: input.alertIds.length,
      totalUpdated: updatedAlerts.length
    };
  }

  async resolve(id: string, input: AlertLifecycleActionRequest): Promise<AlertSummary> {
    return applyAlertMutation(
      this,
      id,
      { status: "resolved" },
      {
        action: "resolved",
        note: input.note,
        timestamp: "2026-04-15T10:15:00.000Z"
      },
      "2026-04-15T10:15:00.000Z"
    );
  }

  async bulkResolve(input: AlertBulkLifecycleActionRequest): Promise<AlertBulkActionResult> {
    const updatedAlerts = await Promise.all(
      input.alertIds.map((alertId) => this.resolve(alertId, { note: input.note }))
    );

    return {
      updatedAlerts,
      totalRequested: input.alertIds.length,
      totalUpdated: updatedAlerts.length
    };
  }

  async assign(id: string, input: AlertAssignActionRequest): Promise<AlertSummary> {
    return applyAlertMutation(
      this,
      id,
      {
        assignedTo: input.assignedTo,
        reviewState: "under_review"
      },
      {
        action: "assigned",
        note: input.note,
        assignedTo: input.assignedTo,
        reviewState: "under_review",
        timestamp: "2026-04-15T10:20:00.000Z"
      },
      "2026-04-15T10:20:00.000Z"
    );
  }

  async bulkAssign(input: AlertBulkAssignActionRequest): Promise<AlertBulkActionResult> {
    const updatedAlerts = await Promise.all(
      input.alertIds.map((alertId) =>
        this.assign(alertId, { assignedTo: input.assignedTo, note: input.note })
      )
    );

    return {
      updatedAlerts,
      totalRequested: input.alertIds.length,
      totalUpdated: updatedAlerts.length
    };
  }

  async unassign(id: string, input: AlertUnassignActionRequest): Promise<AlertSummary> {
    return applyAlertMutation(
      this,
      id,
      {
        assignedTo: undefined
      },
      {
        action: "unassigned",
        note: input.note,
        timestamp: "2026-04-15T10:25:00.000Z"
      },
      "2026-04-15T10:25:00.000Z"
    );
  }

  async setReviewState(id: string, input: AlertReviewStateActionRequest): Promise<AlertSummary> {
    return applyAlertMutation(
      this,
      id,
      {
        reviewState: input.reviewState,
        reviewLabel: input.reviewLabel
      },
      {
        action: "review_state_changed",
        note: input.note,
        reviewState: input.reviewState,
        reviewLabel: input.reviewLabel,
        timestamp: "2026-04-15T10:30:00.000Z"
      },
      "2026-04-15T10:30:00.000Z"
    );
  }

  async bulkSetReviewState(
    input: AlertBulkReviewStateActionRequest
  ): Promise<AlertBulkActionResult> {
    const updatedAlerts = await Promise.all(
      input.alertIds.map((alertId) =>
        this.setReviewState(alertId, {
          reviewState: input.reviewState,
          reviewLabel: input.reviewLabel,
          note: input.note
        })
      )
    );

    return {
      updatedAlerts,
      totalRequested: input.alertIds.length,
      totalUpdated: updatedAlerts.length
    };
  }

  async getById(id: string): Promise<AlertSummary> {
    return getAlerts(this).find((item) => item.id === id) ?? getAlerts(this)[0];
  }

  async list(query: AlertsListQueryContract): Promise<ListResponse<AlertSummary>> {
    const filtered = filterAlertsByQuery(getAlerts(this), query);
    return createPage(sortAlertsByQuery(filtered, query.sortBy), query.page, query.pageSize);
  }

  async summary(query: AlertsListQueryContract): Promise<AlertQueueSummary> {
    return summarizeAlertQueue(filterAlertsByQuery(getAlerts(this), query));
  }

  async listOpen(): Promise<ListResponse<AlertSummary>> {
    return createPage(getAlerts(this).filter((item) => item.status === "open"));
  }
}
