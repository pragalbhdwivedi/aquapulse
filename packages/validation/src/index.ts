import { z } from "zod";

export const pondCreateSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  farmId: z.string().min(1),
  kind: z.enum(["pond", "tank", "cage"])
});

export const pondUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).optional(),
  farmId: z.string().min(1).optional(),
  kind: z.enum(["pond", "tank", "cage"]).optional(),
  status: z.enum(["active", "maintenance", "inactive"]).optional()
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

export const waterQualityEntryUpdateSchema = z.object({
  pondId: z.string().min(1).optional(),
  recordedAt: z.string().min(1).optional(),
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

export const alertBulkLifecycleActionSchema = z.object({
  alertIds: z.array(z.string().min(1)).min(1),
  note: z.string().min(1).optional()
});

export const alertBulkAssignActionSchema = alertBulkLifecycleActionSchema.extend({
  assignedTo: z.string().min(1)
});

export const alertBulkReviewStateActionSchema = alertBulkLifecycleActionSchema.extend({
  reviewState: z.enum(["unreviewed", "under_review", "reviewed", "deferred"]),
  reviewLabel: z.string().min(1).optional()
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
  originalText: z.string().min(1),
  tone: z.enum(["operator", "formal", "management", "audit"]),
  outputMode: z.enum(["english_only", "bilingual"]).optional(),
  linkedRecordType: z.enum(["alert", "task", "incident"]).optional(),
  linkedRecordId: z.string().min(1).optional()
});

export const aiAlertExplanationRequestSchema = z.object({
  alertId: z.string().min(1),
  includeRecommendations: z.boolean().optional(),
  reuseCached: z.boolean().optional(),
  tone: z.enum(["operator", "formal", "management", "audit"]).optional(),
  outputMode: z.enum(["english_only", "bilingual"]).optional()
});

const aiStructuredOutputMetadataSchema = z.object({
  outputMode: z.enum(["english_only", "bilingual"]),
  primaryLanguage: z.enum(["english", "hindi"]),
  bilingual: z.boolean(),
  tone: z.enum(["operator", "formal", "management", "audit"]).optional()
});

const alertExplanationCauseSchema = z.object({
  category: z.enum(["water_quality", "feed", "equipment", "operator_process", "environmental", "unknown"]),
  label: z.string().min(1),
  rationale: z.string().min(1),
  likelihood: z.enum(["low", "medium", "high"])
});

const alertExplanationStepSchema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  priority: z.enum(["immediate", "next_round", "monitor"])
});

export const aiAlertExplanationResponseSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  explanation: z.string().min(1),
  explanationHindi: z.string().min(1).optional(),
  recommendations: z.array(z.string().min(1)),
  likelyCauses: z.array(alertExplanationCauseSchema),
  likelyFactors: z.array(alertExplanationCauseSchema),
  recommendedChecks: z.array(alertExplanationStepSchema),
  immediateChecks: z.array(alertExplanationStepSchema),
  suggestedActions: z.array(alertExplanationStepSchema),
  escalationConsiderations: z.array(z.string().min(1)),
  observedFacts: z.array(z.string().min(1)),
  confidenceNote: z.string().min(1),
  advisoryDisclaimer: z.string().min(1),
  missingInformationNote: z.string().min(1).optional(),
  metadata: z.object({
    mode: z.enum(["fallback", "openai_nano"]),
    advisoryOnly: z.literal(true),
    generatedAt: z.string().min(1),
    modelLabel: z.string().min(1),
    sourceLabel: z.string().min(1),
    usedLiveOpenAi: z.boolean(),
    providerPath: z.enum(["deterministic_fallback", "openai_responses_api"]),
    output: aiStructuredOutputMetadataSchema
  }),
  cache: z.object({
    status: z.enum(["fresh", "reused"]),
    cachedAt: z.string().min(1),
    freshness: z.enum(["fresh", "stale"]),
    explanationVersion: z.literal("v1"),
    generation: z.enum(["cached_reuse", "fresh_fallback", "fresh_openai_nano"])
  }),
  feedbackSummary: z
    .object({
      latest: z
        .object({
          alertId: z.string().min(1),
          value: z.enum(["useful", "not_useful", "neutral"]),
          note: z.string().min(1).optional(),
          submittedAt: z.string().min(1),
          generation: z.enum(["cached_reuse", "fresh_fallback", "fresh_openai_nano"]),
          sourceMode: z.enum(["fallback", "openai_nano"])
        })
        .optional()
    })
    .optional()
});

export const alertExplanationAttachmentSchema = z.object({
  explanation: aiAlertExplanationResponseSchema,
  note: z.string().min(1).optional()
});

export const aiDashboardQueryRequestSchema = z.object({
  question: z.string().min(3),
  pondId: z.string().min(1).optional(),
  dateRange: z.object({
    from: z.string().min(1).optional(),
    to: z.string().min(1).optional()
  }).optional(),
  tone: z.enum(["operator", "formal", "management", "audit"]).optional(),
  outputMode: z.enum(["english_only", "bilingual"]).optional()
});

const aiOperatorAssistanceMetadataSchema = z.object({
  taskLabel: z.enum([
    "daily_farm_summary",
    "shift_handover_generate",
    "dashboard_assistant_query",
    "incident_rewrite",
    "approval_note_draft",
    "incident_draft"
  ]),
  advisoryOnly: z.literal(true),
  mode: z.enum(["fallback", "openai_nano"]),
  generatedAt: z.string().min(1),
  modelLabel: z.string().min(1),
  sourceLabel: z.string().min(1),
  usedLiveOpenAi: z.boolean(),
  providerPath: z.enum(["deterministic_fallback", "openai_responses_api"]),
  output: aiStructuredOutputMetadataSchema
});

const aiOperatorAssistanceAuditMetadataSchema = z.object({
  requestId: z.string().min(1),
  responseId: z.string().min(1),
  requestLoggedAt: z.string().min(1),
  responseLoggedAt: z.string().min(1),
  fallbackUsed: z.boolean()
});

const aiOperatorAttentionItemSchema = z.object({
  pondId: z.string().min(1).optional(),
  pondName: z.string().min(1),
  reason: z.string().min(1),
  priority: z.enum(["low", "medium", "high"])
});

const aiDashboardPriorityItemSchema = z.object({
  label: z.string().min(1),
  detail: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  pondId: z.string().min(1).optional(),
  pondName: z.string().min(1).optional()
});

const aiDashboardSupportingFactSchema = z.object({
  label: z.string().min(1),
  detail: z.string().min(1),
  pondId: z.string().min(1).optional(),
  pondName: z.string().min(1).optional(),
  severity: z.enum(["low", "medium", "high"]).optional()
});

export const aiDailyFarmSummaryRequestSchema = z.object({
  pondId: z.string().min(1).optional(),
  farmId: z.string().min(1).optional(),
  generatedForDate: z.string().min(1).optional(),
  dateRange: z.object({
    from: z.string().min(1).optional(),
    to: z.string().min(1).optional()
  }).optional(),
  includeMissingDataSignals: z.boolean().optional(),
  tone: z.enum(["operator", "formal", "management", "audit"]).optional(),
  outputMode: z.enum(["english_only", "bilingual"]).optional()
});

export const aiDailyFarmSummaryResponseSchema = z.object({
  summary: z.string().min(1),
  summaryHindi: z.string().min(1).optional(),
  highlights: z.array(z.string().min(1)),
  headline: z.string().min(1),
  headlineHindi: z.string().min(1).optional(),
  keyHighlights: z.array(z.string().min(1)),
  openIssues: z.array(z.string().min(1)),
  pendingActions: z.array(z.string().min(1)),
  pondsNeedingAttention: z.array(aiOperatorAttentionItemSchema),
  missingDataNotes: z.array(z.string().min(1)),
  metadata: aiOperatorAssistanceMetadataSchema.extend({
    taskLabel: z.literal("daily_farm_summary")
  }),
  audit: aiOperatorAssistanceAuditMetadataSchema
});

export const aiShiftHandoverRequestSchema = z.object({
  shiftDate: z.string().min(1),
  pondIds: z.array(z.string().min(1)).optional(),
  shiftLabel: z.string().min(1).optional(),
  includeCompletedItems: z.boolean().optional(),
  tone: z.enum(["operator", "formal", "management", "audit"]).optional(),
  outputMode: z.enum(["english_only", "bilingual"]).optional()
});

export const aiShiftHandoverResponseSchema = z.object({
  summary: z.string().min(1),
  summaryHindi: z.string().min(1).optional(),
  actionItems: z.array(z.string().min(1)),
  headline: z.string().min(1),
  headlineHindi: z.string().min(1).optional(),
  completedThisShift: z.array(z.string().min(1)),
  pendingItems: z.array(z.string().min(1)),
  priorityPonds: z.array(aiOperatorAttentionItemSchema),
  watchItems: z.array(z.string().min(1)),
  nextShiftNote: z.string().min(1),
  nextShiftNoteHindi: z.string().min(1).optional(),
  metadata: aiOperatorAssistanceMetadataSchema.extend({
    taskLabel: z.literal("shift_handover_generate")
  }),
  audit: aiOperatorAssistanceAuditMetadataSchema
});

export const aiDashboardAssistantResponseSchema = z.object({
  headline: z.string().min(1),
  headlineHindi: z.string().min(1).optional(),
  directAnswer: z.string().min(1),
  directAnswerHindi: z.string().min(1).optional(),
  priorityItems: z.array(aiDashboardPriorityItemSchema),
  supportingFacts: z.array(aiDashboardSupportingFactSchema),
  recommendedNextChecks: z.array(z.string().min(1)),
  missingInformationNote: z.string().min(1).optional(),
  answer: z.string().min(1),
  relatedMetrics: z.array(z.string().min(1)),
  metadata: aiOperatorAssistanceMetadataSchema.extend({
    taskLabel: z.literal("dashboard_assistant_query")
  }),
  audit: aiOperatorAssistanceAuditMetadataSchema
});

export const aiIncidentRewriteResponseSchema = z.object({
  originalText: z.string().min(1),
  rewrittenEnglish: z.string().min(1),
  rewrittenHindi: z.string().min(1).optional(),
  tone: z.enum(["operator", "formal", "management", "audit"]),
  clarificationNote: z.string().min(1).optional(),
  missingInformationNote: z.string().min(1).optional(),
  metadata: aiOperatorAssistanceMetadataSchema.extend({
    taskLabel: z.literal("incident_rewrite")
  }),
  audit: aiOperatorAssistanceAuditMetadataSchema
});

export const aiApprovalNoteDraftRequestSchema = z.object({
  recordType: z.enum(["alert", "task", "incident"]),
  recordId: z.string().min(1).optional(),
  mode: z.enum(["closure_note", "escalation_justification", "needs_review", "pending_verification"]),
  promptNote: z.string().min(1).optional(),
  outputMode: z.enum(["english_only", "bilingual"]).optional(),
  tone: z.enum(["operator", "formal", "management", "audit"]).optional()
});

export const aiApprovalNoteDraftResponseSchema = z.object({
  headline: z.string().min(1),
  draftNote: z.string().min(1),
  draftNoteHindi: z.string().min(1).optional(),
  rationaleSummary: z.string().min(1),
  suggestedNextChecks: z.array(z.string().min(1)),
  reviewRequired: z.boolean(),
  missingInformationNote: z.string().min(1).optional(),
  metadata: aiOperatorAssistanceMetadataSchema.extend({
    taskLabel: z.literal("approval_note_draft")
  }),
  audit: aiOperatorAssistanceAuditMetadataSchema
});

export const aiIncidentDraftRequestSchema = z.object({
  rawOperatorNotes: z.string().min(1),
  linkedAlertId: z.string().min(1).optional(),
  linkedTaskId: z.string().min(1).optional(),
  linkedPondId: z.string().min(1).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  urgencyHint: z.enum(["low", "medium", "high"]).optional(),
  categoryHint: z.string().min(1).optional(),
  outputMode: z.enum(["english_only", "bilingual"]).optional(),
  tone: z.enum(["operator", "formal", "management", "audit"]).optional()
});

export const aiIncidentDraftResponseSchema = z.object({
  headline: z.string().min(1),
  incidentSummary: z.string().min(1),
  keyFacts: z.array(z.string().min(1)),
  likelyImpact: z.string().min(1),
  immediateActionsSuggested: z.array(z.string().min(1)),
  escalationNeed: z.string().min(1),
  draftEnglish: z.string().min(1),
  draftHindi: z.string().min(1).optional(),
  missingInformationNote: z.string().min(1).optional(),
  metadata: aiOperatorAssistanceMetadataSchema.extend({
    taskLabel: z.literal("incident_draft")
  }),
  audit: aiOperatorAssistanceAuditMetadataSchema
});
