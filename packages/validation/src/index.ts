import { z } from "zod";

export const pondCreateSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  farmId: z.string().min(1),
  kind: z.enum(["pond", "tank", "cage"])
});

export const batchCreateSchema = z.object({
  name: z.string().min(2),
  pondId: z.string().min(1),
  species: z.string().min(2),
  stockCount: z.number().int().nonnegative()
});

export const waterQualityEntryCreateSchema = z.object({
  pondId: z.string().min(1),
  recordedAt: z.string().min(1),
  temperatureC: z.number().optional(),
  ph: z.number().optional()
});

export const feedEntryCreateSchema = z.object({
  pondId: z.string().min(1),
  feedType: z.string().min(2),
  quantityKg: z.number().positive(),
  fedAt: z.string().min(1),
  batchId: z.string().optional()
});

export const feedEntryUpdateSchema = z.object({
  feedType: z.string().min(2).optional(),
  quantityKg: z.number().positive().optional(),
  fedAt: z.string().min(1).optional(),
  batchId: z.string().optional()
});

export const alertQueryFiltersSchema = z.object({
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z.enum(["open", "acknowledged", "resolved"]).optional(),
  pondId: z.string().optional(),
  assignedTo: z.string().optional(),
  reviewState: z.enum(["unreviewed", "under_review", "reviewed", "deferred"]).optional()
});

export const alertLifecycleActionSchema = z.object({
  note: z.string().min(1).optional()
});

export const alertAssignActionSchema = z.object({
  assignedTo: z.string().min(1),
  note: z.string().min(1).optional()
});

export const alertUnassignActionSchema = z.object({
  note: z.string().min(1).optional()
});

export const alertReviewStateActionSchema = z.object({
  reviewState: z.enum(["unreviewed", "under_review", "reviewed", "deferred"]),
  reviewLabel: z.string().min(1).optional(),
  note: z.string().min(1).optional()
});

export const taskCreateSchema = z.object({
  title: z.string().min(2),
  assigneeId: z.string().optional(),
  pondId: z.string().optional()
});

export const taskUpdateSchema = z.object({
  title: z.string().min(2).optional(),
  status: z.enum(["todo", "in_progress", "done", "cancelled"]).optional(),
  assigneeId: z.string().optional(),
  pondId: z.string().optional()
});

export const attachmentMetadataCreateSchema = z.object({
  resourceType: z.string().min(1),
  resourceId: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative()
});

export const aiTextRewriteRequestSchema = z.object({
  text: z.string().min(1),
  tone: z.enum(["concise", "formal", "friendly"])
});

export const aiAlertExplanationRequestSchema = z.object({
  alertId: z.string().min(1),
  includeRecommendations: z.boolean().optional()
});

export const aiDashboardQueryRequestSchema = z.object({
  question: z.string().min(3)
});
