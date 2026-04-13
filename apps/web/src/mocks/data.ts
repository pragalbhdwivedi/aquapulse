import type {
  AlertSummary,
  AuditEvent,
  BatchSummary,
  PondSummary,
  TaskSummary,
  WaterQualityReading,
} from "@aquapulse/types";

const now = "2026-04-13T12:00:00.000Z";

export const mockPonds: PondSummary[] = [
  {
    id: "pond-1",
    name: "North Pond 1",
    code: "NP-01",
    farmId: "farm-1",
    kind: "pond",
    status: "active",
    areaSqm: 1200,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "pond-2",
    name: "Reservoir Tank A",
    code: "RT-A",
    farmId: "farm-1",
    kind: "tank",
    status: "maintenance",
    areaSqm: 320,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockBatches: BatchSummary[] = [
  {
    id: "batch-1",
    name: "Tilapia Cycle Alpha",
    pondId: "pond-1",
    species: "Tilapia",
    stockCount: 4200,
    lifecycleStage: "growing",
    stockedAt: now,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockWaterQualityReadings: WaterQualityReading[] = [
  {
    id: "wq-1",
    pondId: "pond-1",
    recordedAt: now,
    temperatureC: 28.4,
    ph: 7.6,
    dissolvedOxygenMgL: 5.8,
    ammoniaMgL: 0.2,
    notes: "Morning reading placeholder.",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockAlerts: AlertSummary[] = [
  {
    id: "alert-1",
    title: "Low dissolved oxygen warning",
    severity: "high",
    source: "water-quality",
    pondId: "pond-1",
    status: "open",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockTasks: TaskSummary[] = [
  {
    id: "task-1",
    title: "Inspect aeration equipment",
    description: "Placeholder task generated from an alert workflow.",
    status: "todo",
    dueAt: "2026-04-14T06:00:00.000Z",
    assigneeId: "user-1",
    pondId: "pond-1",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockAuditEvents: AuditEvent[] = [
  {
    id: "audit-1",
    actorId: "user-1",
    action: "update",
    resourceType: "alert",
    resourceId: "alert-1",
    summary: "Placeholder alert acknowledgement flow.",
    createdAt: now,
    updatedAt: now,
  },
];
