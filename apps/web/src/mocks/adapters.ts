import {
  buildAlertQueueSummary,
  evaluateFeedAlertDecisions,
  filterAlertsByQuery,
  evaluateWaterQualityAlertDecisions,
  findMatchingOperationalAlert,
  sortAlertsByQuery
} from "@aquapulse/types";
import type {
  AlertAssignActionRequest,
  AlertBulkAssignActionRequest,
  AlertBulkLifecycleActionRequest,
  AlertBulkReviewStateActionRequest,
  AlertLifecycleActionRequest,
  AlertQueueSummary,
  AlertReviewStateActionRequest,
  AiAlertsExplainRequest,
  AiDashboardQueryRequest,
  AiHandoverGenerateRequest,
  AiIncidentsDraftRequest,
  AiPondsSummarizeRequest,
  AiTextRewriteRequest,
  AlertSummary,
  AlertUnassignActionRequest,
  FeedCreateRequest,
  FeedUpdateRequest,
  TaskCreateRequest,
  TaskUpdateRequest,
  WaterQualityCreateRequest
} from "@aquapulse/types";
import type { OperationalAlertDecision } from "@aquapulse/types";
import {
  feedEntryCreateSchema,
  feedEntryUpdateSchema,
  taskCreateSchema,
  taskUpdateSchema,
  waterQualityEntryCreateSchema
} from "@aquapulse/validation";
import {
  normalizeListQuery,
  type AiApiClient,
  type AlertsApiClient,
  type AlertsListQuery,
  type AttachmentsApiClient,
  type AttachmentsListQuery,
  type AuditApiClient,
  type AuditListQuery,
  type BatchesApiClient,
  type BatchesListQuery,
  type FeedApiClient,
  type FeedListQuery,
  type PondsApiClient,
  type PondsListQuery,
  type TasksApiClient,
  type TasksListQuery,
  type WaterQualityApiClient,
  type WaterQualityListQuery
} from "../contracts/api";
import { list, ok } from "../lib/api-response";
import {
  mockAiResponses,
  mockAlerts,
  mockAttachments,
  mockAudit,
  mockBatches,
  mockFeedEntries,
  mockPonds,
  mockTasks,
  mockWaterQuality
} from "./data";

function matchesSearch(value: string | undefined, search: string | undefined): boolean {
  return search ? (value ?? "").toLowerCase().includes(search.toLowerCase()) : true;
}

function upsertMockOperationalAlert(decision: OperationalAlertDecision) {
  const existing = findMatchingOperationalAlert(mockAlerts, decision);

  if (existing) {
    const updated: AlertSummary = {
      ...existing,
      title: decision.title,
      severity: decision.severity,
      source: decision.source,
      pondId: decision.pondId,
      status: decision.status,
      latestNote: decision.summary,
      updatedAt: decision.observedAt
    };
    const index = mockAlerts.findIndex((item) => item.id === existing.id);
    if (index >= 0) {
      mockAlerts[index] = updated;
    }
    return updated;
  }

  const created: AlertSummary = {
    id: `alert-${mockAlerts.length + 1}`,
    createdAt: decision.observedAt,
    updatedAt: decision.observedAt,
    title: decision.title,
    severity: decision.severity,
    source: decision.source,
    pondId: decision.pondId,
    status: decision.status,
    reviewState: "unreviewed",
    latestNote: decision.summary,
    actionHistory: [
      {
        action: "created",
        note: decision.summary,
        timestamp: decision.observedAt
      }
    ]
  };
  mockAlerts.push(created);
  return created;
}

export const pondsMockAdapter: PondsApiClient = {
  async list(query?: PondsListQuery) {
    const normalizedQuery = normalizeListQuery(query);
    const items = mockPonds.filter(
      (item) =>
        (!query?.farmId || item.farmId === query.farmId) &&
        (!query?.status || item.status === query.status) &&
        (!query?.kind || item.kind === query.kind) &&
        matchesSearch(`${item.name} ${item.code}`, query?.search)
    );
    return ok(list(items, normalizedQuery));
  },
  async getById(id: string) { return ok(mockPonds.find((item) => item.id === id) ?? mockPonds[0]); },
  async summarize(_input: AiPondsSummarizeRequest) { return ok({ summary: "Placeholder pond summary.", highlights: ["Water quality stable.", "One open alert."] }); }
};
export const batchesMockAdapter: BatchesApiClient = {
  async list(query?: BatchesListQuery) {
    const normalizedQuery = normalizeListQuery(query);
    const items = mockBatches.filter(
      (item) =>
        (!query?.pondId || item.pondId === query.pondId) &&
        (!query?.lifecycleStage || item.lifecycleStage === query.lifecycleStage) &&
        matchesSearch(`${item.name} ${item.species}`, query?.search)
    );
    return ok(list(items, normalizedQuery));
  },
  async getById(id: string) { return ok(mockBatches.find((item) => item.id === id) ?? mockBatches[0]); }
};
export const waterQualityMockAdapter: WaterQualityApiClient = {
  async create(input: WaterQualityCreateRequest) {
    const parsed = waterQualityEntryCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("VALIDATION_ERROR");
    }

    const created = {
      id: `wq-${mockWaterQuality.length + 1}`,
      createdAt: parsed.data.recordedAt,
      updatedAt: parsed.data.recordedAt,
      pondId: parsed.data.pondId,
      recordedAt: parsed.data.recordedAt,
      temperatureC: parsed.data.temperatureC,
      ph: parsed.data.ph
    };
    mockWaterQuality.unshift(created);
    evaluateWaterQualityAlertDecisions(parsed.data).forEach((decision) => {
      upsertMockOperationalAlert(decision);
    });
    return ok(created);
  },
  async list(query: WaterQualityListQuery) {
    const normalizedQuery = normalizeListQuery(query);
    const items = mockWaterQuality.filter(
      (item) =>
        (!normalizedQuery.pondId || item.pondId === normalizedQuery.pondId) &&
        (!normalizedQuery.metric ||
          (normalizedQuery.metric === "temperatureC" ? item.temperatureC !== undefined : item.ph !== undefined))
    );
    return ok(list(items, normalizedQuery));
  },
  async getById(id: string) { return ok(mockWaterQuality.find((item) => item.id === id) ?? mockWaterQuality[0]); }
};
export const alertsMockAdapter: AlertsApiClient = {
  async list(query?: AlertsListQuery) {
    const normalizedQuery = normalizeListQuery(query);
    const items = filterAlertsByQuery(mockAlerts, query);
    return ok(list(sortAlertsByQuery(items, query?.sortBy), normalizedQuery));
  },
  async summary(query?: AlertsListQuery) {
    return ok(buildAlertQueueSummary(filterAlertsByQuery(mockAlerts, query)));
  },
  async getById(id: string) { return ok(mockAlerts.find((item) => item.id === id) ?? mockAlerts[0]); },
  async acknowledge(id: string, _input: AlertLifecycleActionRequest) {
    const existing = mockAlerts.find((item) => item.id === id) ?? mockAlerts[0];
    const updated = {
      ...existing,
      status: "acknowledged" as const,
      latestNote: _input.note ?? existing.latestNote,
      actionHistory: [
        ...(existing.actionHistory ?? []),
        {
          action: "acknowledged" as const,
          note: _input.note,
          timestamp: "2026-04-15T10:10:00.000Z"
        }
      ],
      updatedAt: "2026-04-15T10:10:00.000Z"
    };
    const index = mockAlerts.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockAlerts[index] = updated;
    }
    return ok(updated);
  },
  async bulkAcknowledge(input: AlertBulkLifecycleActionRequest) {
    const updatedAlerts = await Promise.all(
      input.alertIds.map((alertId) => alertsMockAdapter.acknowledge(alertId, { note: input.note }).then((result) => result.data))
    );
    return ok({
      updatedAlerts,
      totalRequested: input.alertIds.length,
      totalUpdated: updatedAlerts.length
    });
  },
  async resolve(id: string, _input: AlertLifecycleActionRequest) {
    const existing = mockAlerts.find((item) => item.id === id) ?? mockAlerts[0];
    const updated = {
      ...existing,
      status: "resolved" as const,
      latestNote: _input.note ?? existing.latestNote,
      actionHistory: [
        ...(existing.actionHistory ?? []),
        {
          action: "resolved" as const,
          note: _input.note,
          timestamp: "2026-04-15T10:15:00.000Z"
        }
      ],
      updatedAt: "2026-04-15T10:15:00.000Z"
    };
    const index = mockAlerts.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockAlerts[index] = updated;
    }
    return ok(updated);
  },
  async bulkResolve(input: AlertBulkLifecycleActionRequest) {
    const updatedAlerts = await Promise.all(
      input.alertIds.map((alertId) => alertsMockAdapter.resolve(alertId, { note: input.note }).then((result) => result.data))
    );
    return ok({
      updatedAlerts,
      totalRequested: input.alertIds.length,
      totalUpdated: updatedAlerts.length
    });
  },
  async assign(id: string, input: AlertAssignActionRequest) {
    const existing = mockAlerts.find((item) => item.id === id) ?? mockAlerts[0];
    const updated = {
      ...existing,
      assignedTo: input.assignedTo,
      reviewState: "under_review" as const,
      latestNote: input.note ?? existing.latestNote,
      actionHistory: [
        ...(existing.actionHistory ?? []),
        {
          action: "assigned" as const,
          assignedTo: input.assignedTo,
          reviewState: "under_review" as const,
          note: input.note,
          timestamp: "2026-04-15T10:20:00.000Z"
        }
      ],
      updatedAt: "2026-04-15T10:20:00.000Z"
    };
    const index = mockAlerts.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockAlerts[index] = updated;
    }
    return ok(updated);
  },
  async bulkAssign(input: AlertBulkAssignActionRequest) {
    const updatedAlerts = await Promise.all(
      input.alertIds.map((alertId) =>
        alertsMockAdapter.assign(alertId, { assignedTo: input.assignedTo, note: input.note }).then((result) => result.data)
      )
    );
    return ok({
      updatedAlerts,
      totalRequested: input.alertIds.length,
      totalUpdated: updatedAlerts.length
    });
  },
  async unassign(id: string, input: AlertUnassignActionRequest) {
    const existing = mockAlerts.find((item) => item.id === id) ?? mockAlerts[0];
    const updated = {
      ...existing,
      assignedTo: undefined,
      latestNote: input.note ?? existing.latestNote,
      actionHistory: [
        ...(existing.actionHistory ?? []),
        {
          action: "unassigned" as const,
          note: input.note,
          timestamp: "2026-04-15T10:25:00.000Z"
        }
      ],
      updatedAt: "2026-04-15T10:25:00.000Z"
    };
    const index = mockAlerts.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockAlerts[index] = updated;
    }
    return ok(updated);
  },
  async setReviewState(id: string, input: AlertReviewStateActionRequest) {
    const existing = mockAlerts.find((item) => item.id === id) ?? mockAlerts[0];
    const updated = {
      ...existing,
      reviewState: input.reviewState,
      reviewLabel: input.reviewLabel,
      latestNote: input.note ?? existing.latestNote,
      actionHistory: [
        ...(existing.actionHistory ?? []),
        {
          action: "review_state_changed" as const,
          reviewState: input.reviewState,
          reviewLabel: input.reviewLabel,
          note: input.note,
          timestamp: "2026-04-15T10:30:00.000Z"
        }
      ],
      updatedAt: "2026-04-15T10:30:00.000Z"
    };
    const index = mockAlerts.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockAlerts[index] = updated;
    }
    return ok(updated);
  },
  async bulkSetReviewState(input: AlertBulkReviewStateActionRequest) {
    const updatedAlerts = await Promise.all(
      input.alertIds.map((alertId) =>
        alertsMockAdapter
          .setReviewState(alertId, {
            reviewState: input.reviewState,
            reviewLabel: input.reviewLabel,
            note: input.note
          })
          .then((result) => result.data)
      )
    );
    return ok({
      updatedAlerts,
      totalRequested: input.alertIds.length,
      totalUpdated: updatedAlerts.length
    });
  },
  async explain(_input: AiAlertsExplainRequest) { return ok({ explanation: "Placeholder explanation for the current alert.", recommendations: ["Inspect aeration equipment.", "Repeat the reading."] }); }
};
export const tasksMockAdapter: TasksApiClient = {
  async create(input: TaskCreateRequest) {
    const parsed = taskCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("VALIDATION_ERROR");
    }

    const createdAt = "2026-04-14T11:00:00.000Z";
    const created = {
      id: `task-${mockTasks.length + 1}`,
      createdAt,
      updatedAt: createdAt,
      title: parsed.data.title,
      status: "todo" as const,
      assigneeId: parsed.data.assigneeId,
      pondId: parsed.data.pondId
    };
    mockTasks.unshift(created);
    return ok(created);
  },
  async update(id: string, input: TaskUpdateRequest) {
    const parsed = taskUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("VALIDATION_ERROR");
    }

    const existing = mockTasks.find((item) => item.id === id) ?? mockTasks[0];
    const updated = {
      ...existing,
      ...parsed.data,
      updatedAt: "2026-04-15T08:00:00.000Z"
    };
    const index = mockTasks.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockTasks[index] = updated;
    } else {
      mockTasks.unshift(updated);
    }
    return ok(updated);
  },
  async list(query?: TasksListQuery) {
    const normalizedQuery = normalizeListQuery(query);
    const items = mockTasks.filter(
      (item) =>
        (!query?.assigneeId || item.assigneeId === query.assigneeId) &&
        (!query?.pondId || item.pondId === query.pondId) &&
        (!query?.status || item.status === query.status) &&
        matchesSearch(item.title, query?.search)
    );
    return ok(list(items, normalizedQuery));
  },
  async getById(id: string) { return ok(mockTasks.find((item) => item.id === id) ?? mockTasks[0]); }
};
export const attachmentsMockAdapter: AttachmentsApiClient = {
  async list(query?: AttachmentsListQuery) {
    const normalizedQuery = normalizeListQuery(query);
    const items = mockAttachments.filter(
      (item) =>
        (!query?.resourceType || item.resourceType === query.resourceType) &&
        (!query?.resourceId || item.resourceId === query.resourceId) &&
        matchesSearch(item.fileName, query?.search)
    );
    return ok(list(items, normalizedQuery));
  },
  async getById(id: string) { return ok(mockAttachments.find((item) => item.id === id) ?? mockAttachments[0]); }
};
export const feedMockAdapter: FeedApiClient = {
  async create(input: FeedCreateRequest) {
    const parsed = feedEntryCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("VALIDATION_ERROR");
    }

    const created = {
      id: `feed-${mockFeedEntries.length + 1}`,
      createdAt: parsed.data.fedAt,
      updatedAt: parsed.data.fedAt,
      pondId: parsed.data.pondId,
      batchId: parsed.data.batchId,
      feedType: parsed.data.feedType,
      quantityKg: parsed.data.quantityKg,
      fedAt: parsed.data.fedAt
    };
    mockFeedEntries.unshift(created);
    evaluateFeedAlertDecisions(parsed.data).forEach((decision) => {
      upsertMockOperationalAlert(decision);
    });
    return ok(created);
  },
  async update(id: string, input: FeedUpdateRequest) {
    const parsed = feedEntryUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("VALIDATION_ERROR");
    }

    const existing = mockFeedEntries.find((item) => item.id === id) ?? mockFeedEntries[0];
    const updated = {
      ...existing,
      ...parsed.data,
      updatedAt: "2026-04-15T09:00:00.000Z"
    };
    const index = mockFeedEntries.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockFeedEntries[index] = updated;
    } else {
      mockFeedEntries.unshift(updated);
    }
    return ok(updated);
  },
  async list(query?: FeedListQuery) {
    const normalizedQuery = normalizeListQuery(query);
    const items = mockFeedEntries.filter(
      (item) =>
        (!query?.pondId || item.pondId === query.pondId) &&
        (!query?.batchId || item.batchId === query.batchId) &&
        (!query?.feedType || item.feedType === query.feedType) &&
        matchesSearch(item.feedType, query?.search)
    );
    return ok(list(items, normalizedQuery));
  },
  async getById(id: string) { return ok(mockFeedEntries.find((item) => item.id === id) ?? mockFeedEntries[0]); }
};
export const auditMockAdapter: AuditApiClient = {
  async list(query?: AuditListQuery) {
    const normalizedQuery = normalizeListQuery(query);
    const items = mockAudit.filter(
      (item) =>
        (!query?.resourceType || item.resourceType === query.resourceType) &&
        (!query?.resourceId || item.resourceId === query.resourceId) &&
        (!query?.action || item.action === query.action) &&
        matchesSearch(item.summary, query?.search)
    );
    return ok(list(items, normalizedQuery));
  },
  async getById(id: string) { return ok(mockAudit.find((item) => item.id === id) ?? mockAudit[0]); }
};
export const aiMockAdapter: AiApiClient = {
  async list(query) {
    const normalizedQuery = normalizeListQuery(query);
    const items = mockAiResponses.filter(
      (item) =>
        (!query?.requestId || item.requestId === query.requestId) &&
        (!query?.status || item.status === query.status) &&
        (!query?.model || item.model === query.model) &&
        matchesSearch(item.outputText, query?.search)
    );
    return ok(list(items, normalizedQuery));
  },
  async getById(id: string) { return ok(mockAiResponses.find((item) => item.id === id) ?? mockAiResponses[0]); },
  async rewriteText(input: AiTextRewriteRequest) { return ok({ rewrittenText: `[placeholder] ${input.text}` }); },
  async queryDashboard(_input: AiDashboardQueryRequest) { return ok({ answer: "Placeholder dashboard answer.", relatedMetrics: ["open_alerts", "active_ponds"] }); },
  async generateHandover(_input: AiHandoverGenerateRequest) { return ok({ summary: "Placeholder handover summary.", actionItems: ["Check alert queue.", "Confirm next feed run."] }); },
  async draftIncident(_input: AiIncidentsDraftRequest) { return ok({ draftTitle: "Placeholder incident draft", draftBody: "Placeholder incident body." }); }
};
