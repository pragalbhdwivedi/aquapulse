import type {
  AiAlertsExplainRequest,
  AiDashboardQueryRequest,
  AiHandoverGenerateRequest,
  AiIncidentsDraftRequest,
  AiPondsSummarizeRequest,
  AiTextRewriteRequest,
  TaskCreateRequest,
  WaterQualityCreateRequest
} from "@aquapulse/types";
import { taskCreateSchema, waterQualityEntryCreateSchema } from "@aquapulse/validation";
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
    const items = mockAlerts.filter(
      (item) =>
        (!query?.pondId || item.pondId === query.pondId) &&
        (!query?.severity || item.severity === query.severity) &&
        (!query?.status || item.status === query.status) &&
        (!query?.source || item.source === query.source) &&
        matchesSearch(item.title, query?.search)
    );
    return ok(list(items, normalizedQuery));
  },
  async getById(id: string) { return ok(mockAlerts.find((item) => item.id === id) ?? mockAlerts[0]); },
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
