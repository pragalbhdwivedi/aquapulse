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
  AlertExplanationAttachmentRequest,
  AlertExplanationFeedbackRecord,
  AlertExplanationFeedbackRequest,
  AlertLifecycleActionRequest,
  AlertQueueSummary,
  AlertReviewStateActionRequest,
  AlertSavedViewCreateRequest,
  AlertSavedViewDefinition,
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
  PondUpdateRequest,
  TaskCreateRequest,
  TaskUpdateRequest,
  WaterQualityCreateRequest
  ,
  WaterQualityUpdateRequest
} from "@aquapulse/types";
import type { OperationalAlertDecision } from "@aquapulse/types";
import {
  feedEntryCreateSchema,
  feedEntryUpdateSchema,
  pondUpdateSchema,
  taskCreateSchema,
  taskUpdateSchema,
  waterQualityEntryCreateSchema,
  waterQualityEntryUpdateSchema
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
  mockAlertSavedViews,
  mockAttachments,
  mockAudit,
  mockBatches,
  mockFeedEntries,
  mockPonds,
  mockTasks,
  mockWaterQuality
} from "./data";

const alertExplanationResponseCache = new Map<string, Awaited<ReturnType<AlertsApiClient["explain"]>>["data"]>();
const alertExplanationFeedbackStore = new Map<string, AlertExplanationFeedbackRecord>();
const initialMockAlerts = structuredClone(mockAlerts);
const initialMockSavedViews = structuredClone(mockAlertSavedViews);
const MAX_ALERT_STORE_SIZE = 100;
const MAX_ALERT_HISTORY_ENTRIES = 25;
const MAX_SAVED_VIEW_STORE_SIZE = 25;

function trimAlertHistory(
  entries: AlertSummary["actionHistory"] | undefined
): AlertSummary["actionHistory"] {
  if (!entries) {
    return undefined;
  }

  return entries.length > MAX_ALERT_HISTORY_ENTRIES ? entries.slice(-MAX_ALERT_HISTORY_ENTRIES) : [...entries];
}

function trimAlertStore() {
  if (mockAlerts.length > MAX_ALERT_STORE_SIZE) {
    mockAlerts.splice(0, mockAlerts.length - MAX_ALERT_STORE_SIZE);
  }
}

function trimSavedViewStore() {
  if (mockAlertSavedViews.length > MAX_SAVED_VIEW_STORE_SIZE) {
    mockAlertSavedViews.splice(0, mockAlertSavedViews.length - MAX_SAVED_VIEW_STORE_SIZE);
  }
}

export function resetAlertsMockState() {
  mockAlerts.splice(0, mockAlerts.length, ...structuredClone(initialMockAlerts));
  mockAlertSavedViews.splice(0, mockAlertSavedViews.length, ...structuredClone(initialMockSavedViews));
  alertExplanationResponseCache.clear();
  alertExplanationFeedbackStore.clear();
}

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
      updatedAt: decision.observedAt,
      actionHistory: trimAlertHistory(existing.actionHistory)
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
      actionHistory: trimAlertHistory([
        {
          action: "created",
          note: decision.summary,
          timestamp: decision.observedAt
        }
      ])
    };
    mockAlerts.push(created);
    trimAlertStore();
    return created;
  }

function formatAttachedExplanationNote(input: AlertExplanationAttachmentRequest): string {
  const detailParts = [
    `AI explanation snapshot (${input.explanation.metadata.mode}/${input.explanation.metadata.modelLabel}/${input.explanation.cache.generation})`,
    input.explanation.summary,
    input.explanation.feedbackSummary?.latest
      ? `Feedback: ${input.explanation.feedbackSummary.latest.value}`
      : undefined,
    input.explanation.recommendedChecks[0]?.title
      ? `Next check: ${input.explanation.recommendedChecks[0].title}`
      : undefined,
    input.explanation.suggestedActions[0]?.title
      ? `Suggested action: ${input.explanation.suggestedActions[0].title}`
      : undefined,
    input.note?.trim() ? `Operator note: ${input.note.trim()}` : undefined
  ].filter(Boolean);

  return detailParts.join(" | ");
}

function buildExplanationCacheKey(input: AiAlertsExplainRequest): string {
  return [input.alertId, input.includeRecommendations === false ? "without-recommendations" : "with-recommendations"].join(":");
}

function buildMockExplanation(
  input: AiAlertsExplainRequest,
  generation: "cached_reuse" | "fresh_fallback"
): Awaited<ReturnType<AlertsApiClient["explain"]>>["data"] {
  const generatedAt = "2026-04-16T12:00:00.000Z";
  const latestFeedback = alertExplanationFeedbackStore.get(input.alertId);

  return {
    summary: `Alert ${input.alertId} likely reflects an operational condition that still needs a manual check.`,
    explanation:
      "Placeholder explanation for the current alert. Review the latest note, confirm the condition is still present, and treat this as advisory guidance only.",
    recommendations: ["Inspect aeration equipment.", "Repeat the reading."],
    likelyCauses: [
      {
        category: "water_quality",
        label: "Water-quality threshold or missing reading",
        rationale: "This placeholder explanation assumes the alert originated from a water-quality workflow.",
        likelihood: "medium"
      }
    ],
    recommendedChecks: [
      {
        title: "Repeat the reading",
        detail: "Confirm the underlying condition before making any queue-state decision.",
        priority: "immediate"
      }
    ],
    suggestedActions: [
      {
        title: "Document the recheck outcome",
        detail: "Use the review note flow to record what was verified.",
        priority: "next_round"
      }
    ],
    confidenceNote:
      "Confidence is limited because this placeholder explanation only uses alert-level context.",
    advisoryDisclaimer:
      "Advisory only. This explanation does not acknowledge, resolve, assign, or mutate alerts.",
    metadata: {
      mode: "fallback",
      advisoryOnly: true,
      generatedAt,
      modelLabel: "gpt-5-nano",
      sourceLabel: "frontend_mock_fallback",
      usedLiveOpenAi: false
    },
    cache: {
      status: generation === "cached_reuse" ? "reused" : "fresh",
      cachedAt: generatedAt,
      freshness: "fresh",
      explanationVersion: "v1",
      generation
    },
    feedbackSummary: latestFeedback
      ? {
          latest: latestFeedback
        }
      : undefined
  };
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
  async update(id: string, input: PondUpdateRequest) {
    const parsed = pondUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("VALIDATION_ERROR");
    }

    const existing = mockPonds.find((item) => item.id === id) ?? mockPonds[0];
    const updated = {
      ...existing,
      ...parsed.data,
      updatedAt: "2026-04-15T07:00:00.000Z"
    };
    const index = mockPonds.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockPonds[index] = updated;
    } else {
      mockPonds.unshift(updated);
    }
    return ok(updated);
  },
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
  async update(id: string, input: WaterQualityUpdateRequest) {
    const parsed = waterQualityEntryUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("VALIDATION_ERROR");
    }

    const existing = mockWaterQuality.find((item) => item.id === id) ?? mockWaterQuality[0];
    const updated = {
      ...existing,
      ...parsed.data,
      updatedAt: parsed.data.recordedAt ?? "2026-04-15T10:00:00.000Z"
    };
    const index = mockWaterQuality.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockWaterQuality[index] = updated;
    } else {
      mockWaterQuality.unshift(updated);
    }
    return ok(updated);
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
  async listSavedViews() {
    return ok([...mockAlertSavedViews]);
  },
  async saveSavedView(input: AlertSavedViewCreateRequest) {
    const created: AlertSavedViewDefinition = {
      id: `alert-view-${mockAlertSavedViews.length + 1}`,
      name: input.name,
      presetId: input.presetId,
      query: input.query,
      createdAt: "2026-04-15T10:35:00.000Z",
      updatedAt: "2026-04-15T10:35:00.000Z"
    };
    mockAlertSavedViews.push(created);
    trimSavedViewStore();
    return ok([...mockAlertSavedViews]);
  },
  async removeSavedView(id: string) {
    const index = mockAlertSavedViews.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockAlertSavedViews.splice(index, 1);
    }
    return ok([...mockAlertSavedViews]);
  },
  async acknowledge(id: string, _input: AlertLifecycleActionRequest) {
    const existing = mockAlerts.find((item) => item.id === id) ?? mockAlerts[0];
    const updated = {
      ...existing,
      status: "acknowledged" as const,
      latestNote: _input.note ?? existing.latestNote,
      actionHistory: trimAlertHistory([
        ...(existing.actionHistory ?? []),
        {
          action: "acknowledged" as const,
          note: _input.note,
          timestamp: "2026-04-15T10:10:00.000Z"
        }
      ]),
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
      actionHistory: trimAlertHistory([
        ...(existing.actionHistory ?? []),
        {
          action: "resolved" as const,
          note: _input.note,
          timestamp: "2026-04-15T10:15:00.000Z"
        }
      ]),
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
      actionHistory: trimAlertHistory([
        ...(existing.actionHistory ?? []),
        {
          action: "assigned" as const,
          assignedTo: input.assignedTo,
          reviewState: "under_review" as const,
          note: input.note,
          timestamp: "2026-04-15T10:20:00.000Z"
        }
      ]),
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
      actionHistory: trimAlertHistory([
        ...(existing.actionHistory ?? []),
        {
          action: "unassigned" as const,
          note: input.note,
          timestamp: "2026-04-15T10:25:00.000Z"
        }
      ]),
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
      actionHistory: trimAlertHistory([
        ...(existing.actionHistory ?? []),
        {
          action: "review_state_changed" as const,
          reviewState: input.reviewState,
          reviewLabel: input.reviewLabel,
          note: input.note,
          timestamp: "2026-04-15T10:30:00.000Z"
        }
      ]),
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
  async explain(input: AiAlertsExplainRequest) {
    const cacheKey = buildExplanationCacheKey(input);
    const cached = alertExplanationResponseCache.get(cacheKey);

    if (cached && input.reuseCached !== false) {
      return ok({
        ...cached,
        cache: {
          ...cached.cache,
          status: "reused",
          generation: "cached_reuse"
        },
        feedbackSummary: alertExplanationFeedbackStore.get(input.alertId)
          ? {
              latest: alertExplanationFeedbackStore.get(input.alertId)!
            }
          : cached.feedbackSummary
      });
    }

    const next = buildMockExplanation(input, "fresh_fallback");
    alertExplanationResponseCache.set(cacheKey, next);
    return ok(next);
  },
  async submitExplanationFeedback(input: AlertExplanationFeedbackRequest) {
    const feedback: AlertExplanationFeedbackRecord = {
      alertId: input.alertId,
      value: input.value,
      note: input.note?.trim() || undefined,
      submittedAt: "2026-04-17T09:30:00.000Z",
      sourceMode: input.explanation.metadata.mode,
      generation: input.explanation.cache.generation
    };
    alertExplanationFeedbackStore.set(input.alertId, feedback);
    return ok(feedback);
  },
  async attachExplanation(id: string, input: AlertExplanationAttachmentRequest) {
    const existing = mockAlerts.find((item) => item.id === id) ?? mockAlerts[0];
    const note = formatAttachedExplanationNote(input);
    const updated = {
      ...existing,
      latestNote: note,
      actionHistory: trimAlertHistory([
        ...(existing.actionHistory ?? []),
        {
          action: "ai_explanation_snapshot" as const,
          note,
          timestamp: input.explanation.cache.cachedAt
        }
      ]),
      updatedAt: input.explanation.cache.cachedAt
    };
    const index = mockAlerts.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockAlerts[index] = updated;
    }
    return ok(updated);
  }
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
