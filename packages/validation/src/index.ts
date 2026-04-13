import { z } from "zod";

const optionalId = z.string().min(1);
const optionalIsoDate = z.string().datetime().optional();

export const pondCreateSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(40),
  farmId: z.string().min(1),
  kind: z.enum(["pond", "tank", "cage"]),
  areaSqm: z.number().positive().optional(),
});

export const pondUpdateSchema = pondCreateSchema.partial().extend({
  status: z.enum(["active", "maintenance", "inactive"]).optional(),
});

export const batchCreateSchema = z.object({
  name: z.string().min(2).max(120),
  pondId: z.string().min(1),
  species: z.string().min(2).max(120),
  stockCount: z.number().int().nonnegative(),
  stockedAt: optionalIsoDate,
});

export const batchUpdateSchema = batchCreateSchema.partial().extend({
  lifecycleStage: z.enum(["planned", "stocked", "growing", "harvested"]).optional(),
});

export const waterQualityEntryCreateSchema = z.object({
  pondId: z.string().min(1),
  recordedAt: z.string().datetime(),
  temperatureC: z.number().optional(),
  ph: z.number().min(0).max(14).optional(),
  dissolvedOxygenMgL: z.number().nonnegative().optional(),
  ammoniaMgL: z.number().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
});

export const feedEntryCreateSchema = z.object({
  pondId: z.string().min(1),
  batchId: optionalId.optional(),
  feedType: z.string().min(2).max(120),
  quantityKg: z.number().positive(),
  fedAt: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});

export const alertQueryFiltersSchema = z.object({
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z.enum(["open", "acknowledged", "resolved"]).optional(),
  pondId: optionalId.optional(),
  source: z.string().min(1).optional(),
});

export const taskCreateSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(2000).optional(),
  dueAt: optionalIsoDate,
  assigneeId: optionalId.optional(),
  pondId: optionalId.optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  status: z.enum(["todo", "in_progress", "done", "cancelled"]).optional(),
});

export const attachmentMetadataCreateSchema = z.object({
  resourceType: z.string().min(1).max(80),
  resourceId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().nonnegative(),
});

export const aiTextRewriteRequestSchema = z.object({
  text: z.string().min(1).max(10000),
  tone: z.enum(["concise", "formal", "friendly"]),
});

export const aiAlertExplanationRequestSchema = z.object({
  alertId: z.string().min(1),
  includeRecommendations: z.boolean().optional(),
});

export const aiDashboardQueryRequestSchema = z.object({
  question: z.string().min(3).max(2000),
  dateRange: z
    .object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    })
    .optional(),
});

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type PondCreateInput = z.infer<typeof pondCreateSchema>;
export type PondUpdateInput = z.infer<typeof pondUpdateSchema>;
export type BatchCreateInput = z.infer<typeof batchCreateSchema>;
export type BatchUpdateInput = z.infer<typeof batchUpdateSchema>;
