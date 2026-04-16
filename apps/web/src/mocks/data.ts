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
    createdAt: now,
    updatedAt: now,
    requestId: "ai-request-1",
    status: "completed",
    outputText: "Placeholder AI output.",
    model: "gpt-5.4"
  }
];
