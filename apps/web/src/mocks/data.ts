import type {
  AiResponseRecord,
  AlertSavedViewDefinition,
  AlertSummary,
  AttachmentMetadata,
  AuditEvent,
  BatchSummary,
  FeedEntry,
  PondSummary,
  TaskSummary,
  WaterQualityReading
} from "@aquapulse/types";

const now = "2026-04-13T00:00:00.000Z";

export const mockPonds: PondSummary[] = [
  { id: "pond-1", createdAt: now, updatedAt: now, name: "North Pond 1", code: "NP-01", farmId: "farm-1", kind: "pond", status: "active" }
];
export const mockBatches: BatchSummary[] = [
  { id: "batch-1", createdAt: now, updatedAt: now, name: "Tilapia Cycle Alpha", pondId: "pond-1", species: "Tilapia", stockCount: 4200, lifecycleStage: "growing" }
];
export const mockWaterQuality: WaterQualityReading[] = [
  { id: "wq-1", createdAt: now, updatedAt: now, pondId: "pond-1", recordedAt: now, temperatureC: 28.4, ph: 7.6 }
];
export const mockAlerts: AlertSummary[] = [
  {
    id: "alert-1",
    createdAt: now,
    updatedAt: now,
    title: "Low dissolved oxygen warning",
    severity: "high",
    source: "water-quality",
    pondId: "pond-1",
    status: "open",
    reviewState: "unreviewed",
    actionHistory: [{ action: "created", timestamp: now }]
  }
];
export const mockAlertSavedViews: AlertSavedViewDefinition[] = [];
export const mockTasks: TaskSummary[] = [
  { id: "task-1", createdAt: now, updatedAt: now, title: "Inspect aeration equipment", status: "todo", assigneeId: "user-1", pondId: "pond-1" }
];
export const mockAudit: AuditEvent[] = [
  { id: "audit-1", createdAt: now, updatedAt: now, action: "update", resourceType: "alert", resourceId: "alert-1", summary: "Placeholder audit event" }
];
export const mockAttachments: AttachmentMetadata[] = [
  {
    id: "attachment-1",
    createdAt: now,
    updatedAt: now,
    resourceType: "alert",
    resourceId: "alert-1",
    fileName: "sample-photo.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 102400
  }
];
export const mockFeedEntries: FeedEntry[] = [
  {
    id: "feed-1",
    createdAt: now,
    updatedAt: now,
    pondId: "pond-1",
    batchId: "batch-1",
    feedType: "Starter Feed",
    quantityKg: 35,
    fedAt: now
  }
];
export const mockAiResponses: AiResponseRecord[] = [
  {
    id: "ai-response-1",
    createdAt: "2026-05-09T06:00:05.000Z",
    updatedAt: "2026-05-09T06:00:05.000Z",
    requestId: "ai-request-1",
    status: "completed",
    outputText: JSON.stringify({
      headline: "Farm-wide daily summary",
      summary: "Two ponds need follow-up today.",
      metadata: {
        mode: "fallback",
        advisoryOnly: true,
        providerPath: "deterministic_fallback",
        usedLiveOpenAi: false
      }
    }),
    model: "gpt-5-nano",
    requestType: "daily_farm_summary",
    providerMode: "fallback",
    providerPath: "deterministic_fallback",
    outputPreview: "Farm-wide daily summary",
    relatedRecordIds: ["pond-1"],
    advisoryOnly: true
  },
  {
    id: "ai-response-2",
    createdAt: "2026-05-09T06:20:05.000Z",
    updatedAt: "2026-05-09T06:20:05.000Z",
    requestId: "ai-request-2",
    status: "completed",
    outputText: JSON.stringify({
      headline: "Dashboard assistant",
      directAnswer: "Start with North Pond 1.",
      metadata: {
        mode: "openai_nano",
        advisoryOnly: true,
        providerPath: "openai_responses_api",
        usedLiveOpenAi: true
      }
    }),
    model: "gpt-5.4",
    requestType: "dashboard_assistant_query",
    providerMode: "provider_backed",
    providerPath: "openai_responses_api",
    outputPreview: "Start with North Pond 1.",
    relatedRecordIds: ["pond-1"],
    advisoryOnly: true
  },
  {
    id: "ai-response-3",
    createdAt: "2026-05-09T06:40:05.000Z",
    updatedAt: "2026-05-09T06:40:05.000Z",
    requestId: "ai-request-3",
    status: "completed",
    outputText: JSON.stringify({
      headline: "Incident draft for North Pond 1",
      incidentSummary: "Oxygen warning was observed and rechecked.",
      draftEnglish: "Operator note: Oxygen warning was observed and rechecked.",
      metadata: {
        mode: "fallback",
        advisoryOnly: true,
        providerPath: "deterministic_fallback",
        usedLiveOpenAi: false
      }
    }),
    model: "gpt-5-nano",
    requestType: "incident_draft",
    providerMode: "fallback",
    providerPath: "deterministic_fallback",
    outputPreview: "Incident draft for North Pond 1",
    relatedRecordIds: ["alert-1", "task-1", "pond-1"],
    advisoryOnly: true
  }
];
