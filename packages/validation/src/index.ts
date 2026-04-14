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

export const alertQueryFiltersSchema = z.object({
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z.enum(["open", "acknowledged", "resolved"]).optional(),
  pondId: z.string().optional()
});

export const taskCreateSchema = z.object({
  title: z.string().min(2),
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
