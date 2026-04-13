import type { AlertSummary, AuditEvent, BatchSummary, PondSummary, TaskSummary, WaterQualityReading } from "@aquapulse/types";

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
  { id: "alert-1", createdAt: now, updatedAt: now, title: "Low dissolved oxygen warning", severity: "high", source: "water-quality", pondId: "pond-1", status: "open" }
];
export const mockTasks: TaskSummary[] = [
  { id: "task-1", createdAt: now, updatedAt: now, title: "Inspect aeration equipment", status: "todo", assigneeId: "user-1", pondId: "pond-1" }
];
export const mockAudit: AuditEvent[] = [
  { id: "audit-1", createdAt: now, updatedAt: now, action: "update", resourceType: "alert", resourceId: "alert-1", summary: "Placeholder audit event" }
];
