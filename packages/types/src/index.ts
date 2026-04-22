export type EntityId = string;
export type ISODateString = string;
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertReviewState = "unreviewed" | "under_review" | "reviewed" | "deferred";
export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type SortDirection = "asc" | "desc";
export type OperationalAlertSource = "water-quality" | "feed";
export type OperationalAlertRuleCode =
  | "water_quality_threshold_breach"
  | "water_quality_missing_critical_values"
  | "feed_quantity_anomaly";

export interface BaseEntity {
  readonly id: EntityId;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

export interface PageMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface PaginationParams {
  readonly page: number;
  readonly pageSize: number;
}

export interface DateRange {
  readonly from?: ISODateString;
  readonly to?: ISODateString;
}

export interface SortOption {
  readonly field: string;
  readonly direction: SortDirection;
}

export interface FilterOption<TValue = string | number | boolean> {
  readonly field: string;
  readonly value: TValue;
  readonly operator?: "eq" | "contains" | "gte" | "lte";
}

export interface ListQueryRequest extends PaginationParams {
  readonly search?: string;
  readonly sort?: SortOption[];
  readonly filters?: FilterOption[];
  readonly dateRange?: DateRange;
}

export interface ApiSuccessEnvelope<TData> {
  readonly ok: true;
  readonly data: TData;
  readonly meta?: Record<string, unknown>;
}

export interface ApiErrorEnvelope {
  readonly ok: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
  };
}

export interface ListResponse<TItem> {
  readonly items: TItem[];
  readonly page: PageMeta;
}

export interface PondSummary extends BaseEntity {
  readonly name: string;
  readonly code: string;
  readonly farmId: EntityId;
  readonly kind: "pond" | "tank" | "cage";
  readonly status: "active" | "maintenance" | "inactive";
}

export interface BatchSummary extends BaseEntity {
  readonly name: string;
  readonly pondId: EntityId;
  readonly species: string;
  readonly stockCount: number;
  readonly lifecycleStage: "planned" | "stocked" | "growing" | "harvested";
}

export interface WaterQualityReading extends BaseEntity {
  readonly pondId: EntityId;
  readonly recordedAt: ISODateString;
  readonly temperatureC?: number;
  readonly ph?: number;
}

export interface WaterQualityCreateRequest {
  readonly pondId: EntityId;
  readonly recordedAt: ISODateString;
  readonly temperatureC?: number;
  readonly ph?: number;
}

export interface FeedEntry extends BaseEntity {
  readonly pondId: EntityId;
  readonly batchId?: EntityId;
  readonly feedType: string;
  readonly quantityKg: number;
  readonly fedAt: ISODateString;
}

export interface FeedCreateRequest {
  readonly pondId: EntityId;
  readonly batchId?: EntityId;
  readonly feedType: string;
  readonly quantityKg: number;
  readonly fedAt: ISODateString;
}

export interface FeedUpdateRequest {
  readonly batchId?: EntityId;
  readonly feedType?: string;
  readonly quantityKg?: number;
  readonly fedAt?: ISODateString;
}

export interface TaskSummary extends BaseEntity {
  readonly title: string;
  readonly status: TaskStatus;
  readonly assigneeId?: EntityId;
  readonly pondId?: EntityId;
}

export interface TaskCreateRequest {
  readonly title: string;
  readonly assigneeId?: EntityId;
  readonly pondId?: EntityId;
}

export interface TaskUpdateRequest {
  readonly title?: string;
  readonly status?: TaskStatus;
  readonly assigneeId?: EntityId;
  readonly pondId?: EntityId;
}

export interface AlertSummary extends BaseEntity {
  readonly title: string;
  readonly severity: AlertSeverity;
  readonly source: string;
  readonly pondId?: EntityId;
  readonly status: "open" | "acknowledged" | "resolved";
  readonly assignedTo?: EntityId;
  readonly reviewState?: AlertReviewState;
  readonly reviewLabel?: string;
  readonly latestNote?: string;
  readonly actionHistory?: AlertActionHistoryItem[];
}

export interface AlertQueueSummary {
  readonly totalAlerts: number;
  readonly statusCounts: {
    readonly open: number;
    readonly acknowledged: number;
    readonly resolved: number;
  };
  readonly assignmentCounts: {
    readonly assigned: number;
    readonly unassigned: number;
  };
  readonly reviewStateCounts: {
    readonly unreviewed: number;
    readonly underReview: number;
    readonly reviewed: number;
    readonly deferred: number;
  };
  readonly noteCounts: {
    readonly withLatestNote: number;
    readonly withoutLatestNote: number;
  };
  readonly severityCounts: {
    readonly low: number;
    readonly medium: number;
    readonly high: number;
    readonly critical: number;
  };
  readonly ownerWorkloads: AlertOwnerWorkloadSummary[];
}

export interface AlertOwnerWorkloadSummary {
  readonly ownerId: EntityId;
  readonly assignedAlerts: number;
  readonly openAlerts: number;
  readonly underReviewAlerts: number;
  readonly unresolvedAlerts: number;
}

export type AlertQueuePresetId =
  | "all_open"
  | "assigned_to_me"
  | "under_review"
  | "with_notes"
  | "resolved_recently";

export interface AlertQueuePresetDefinition {
  readonly id: AlertQueuePresetId;
  readonly label: string;
  readonly description: string;
  readonly query: Partial<AlertsListQueryRequest>;
  readonly requiresAssignedTo?: boolean;
}

export interface AlertLifecycleActionRequest {
  readonly note?: string;
}

export interface AlertAssignActionRequest {
  readonly assignedTo: EntityId;
  readonly note?: string;
}

export interface AlertUnassignActionRequest {
  readonly note?: string;
}

export interface AlertReviewStateActionRequest {
  readonly reviewState: AlertReviewState;
  readonly reviewLabel?: string;
  readonly note?: string;
}

export interface AlertBulkLifecycleActionRequest {
  readonly alertIds: EntityId[];
  readonly note?: string;
}

export interface AlertBulkAssignActionRequest extends AlertBulkLifecycleActionRequest {
  readonly assignedTo: EntityId;
}

export interface AlertBulkReviewStateActionRequest extends AlertBulkLifecycleActionRequest {
  readonly reviewState: AlertReviewState;
  readonly reviewLabel?: string;
}

export interface AlertBulkActionResult {
  readonly updatedAlerts: AlertSummary[];
  readonly totalRequested: number;
  readonly totalUpdated: number;
}

export interface AlertSavedViewDefinition {
  readonly id: EntityId;
  readonly name: string;
  readonly presetId?: AlertQueuePresetId;
  readonly query: Partial<AlertsListQueryRequest>;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

export interface AlertSavedViewCreateRequest {
  readonly name: string;
  readonly presetId?: AlertQueuePresetId;
  readonly query: Partial<AlertsListQueryRequest>;
}

export interface AlertActionHistoryItem {
  readonly action:
    | "created"
    | "acknowledged"
    | "resolved"
    | "assigned"
    | "unassigned"
    | "review_state_changed"
    | "ai_explanation_snapshot";
  readonly note?: string;
  readonly timestamp: ISODateString;
  readonly assignedTo?: EntityId;
  readonly reviewState?: AlertReviewState;
  readonly reviewLabel?: string;
}

export interface OperationalAlertDecision {
  readonly ruleCode: OperationalAlertRuleCode;
  readonly title: string;
  readonly severity: AlertSeverity;
  readonly source: OperationalAlertSource;
  readonly pondId?: EntityId;
  readonly status: "open";
  readonly summary: string;
  readonly dedupeKey: string;
  readonly observedAt: ISODateString;
}

export interface AttachmentMetadata extends BaseEntity {
  readonly resourceType: string;
  readonly resourceId: EntityId;
  readonly fileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
}

export interface AuditEvent extends BaseEntity {
  readonly action: "create" | "update" | "delete" | "view" | "export";
  readonly resourceType: string;
  readonly resourceId?: EntityId;
  readonly summary: string;
}

export interface AiResponseRecord extends BaseEntity {
  readonly requestId: EntityId;
  readonly status: "draft" | "completed" | "rejected";
  readonly outputText: string;
  readonly model: string;
}

export interface AiRequestRecord extends BaseEntity {
  readonly requestType: "alerts_explain" | "ponds_summarize" | "handover_generate" | "text_rewrite" | "dashboard_query" | "incident_draft";
  readonly requestedBy?: EntityId;
  readonly inputPayload: Record<string, unknown>;
  readonly status: "queued" | "processing" | "completed" | "failed";
}

export interface AiFeedbackRecord extends BaseEntity {
  readonly responseId: EntityId;
  readonly rating: "positive" | "negative" | "needs_review";
  readonly comment?: string;
  readonly submittedBy?: EntityId;
}

export interface AiPromptTemplateRecord extends BaseEntity {
  readonly key: string;
  readonly label: string;
  readonly promptText: string;
  readonly version: number;
  readonly status: "draft" | "active" | "archived";
}

export interface AiActionDraftRecord extends BaseEntity {
  readonly responseId: EntityId;
  readonly resourceType: string;
  readonly resourceId?: EntityId;
  readonly title: string;
  readonly body: string;
  readonly status: "draft" | "approved" | "rejected";
}

export interface AiAlertsExplainRequest {
  readonly alertId: EntityId;
  readonly includeRecommendations?: boolean;
  readonly reuseCached?: boolean;
}

export type AlertExplanationFeedbackValue = "useful" | "not_useful" | "neutral";

export type AlertExplanationCauseCategory =
  | "water_quality"
  | "feed"
  | "equipment"
  | "operator_process"
  | "environmental"
  | "unknown";

export interface AlertExplanationLikelyCause {
  readonly category: AlertExplanationCauseCategory;
  readonly label: string;
  readonly rationale: string;
  readonly likelihood: "low" | "medium" | "high";
}

export interface AlertExplanationSuggestedStep {
  readonly title: string;
  readonly detail: string;
  readonly priority: "immediate" | "next_round" | "monitor";
}

export interface AlertExplanationMetadata {
  readonly mode: "fallback" | "openai_nano";
  readonly advisoryOnly: true;
  readonly generatedAt: ISODateString;
  readonly modelLabel: string;
  readonly sourceLabel: string;
  readonly usedLiveOpenAi: boolean;
}

export interface AlertExplanationCacheState {
  readonly status: "fresh" | "reused";
  readonly cachedAt: ISODateString;
  readonly freshness: "fresh" | "stale";
  readonly explanationVersion: "v1";
  readonly generation: "cached_reuse" | "fresh_fallback" | "fresh_openai_nano";
}

export interface AlertExplanationFeedbackRecord {
  readonly alertId: EntityId;
  readonly value: AlertExplanationFeedbackValue;
  readonly note?: string;
  readonly submittedAt: ISODateString;
  readonly generation: AlertExplanationCacheState["generation"];
  readonly sourceMode: AlertExplanationMetadata["mode"];
}

export interface AlertExplanationFeedbackSummary {
  readonly latest?: AlertExplanationFeedbackRecord;
}

export interface AlertExplanationFeedbackRequest {
  readonly alertId: EntityId;
  readonly value: AlertExplanationFeedbackValue;
  readonly note?: string;
  readonly explanation: AiAlertsExplainResponse;
}

export interface AiAlertsExplainResponse {
  readonly explanation: string;
  readonly recommendations: string[];
  readonly summary: string;
  readonly likelyCauses: AlertExplanationLikelyCause[];
  readonly recommendedChecks: AlertExplanationSuggestedStep[];
  readonly suggestedActions: AlertExplanationSuggestedStep[];
  readonly confidenceNote: string;
  readonly advisoryDisclaimer: string;
  readonly metadata: AlertExplanationMetadata;
  readonly cache: AlertExplanationCacheState;
  readonly feedbackSummary?: AlertExplanationFeedbackSummary;
}

export interface AlertExplanationAttachmentRequest {
  readonly explanation: AiAlertsExplainResponse;
  readonly note?: string;
}

export interface AiPondsSummarizeRequest {
  readonly pondId: EntityId;
  readonly dateRange?: DateRange;
}

export interface AiPondsSummarizeResponse {
  readonly summary: string;
  readonly highlights: string[];
}

export interface AiHandoverGenerateRequest {
  readonly shiftDate: ISODateString;
  readonly pondIds?: EntityId[];
}

export interface AiHandoverGenerateResponse {
  readonly summary: string;
  readonly actionItems: string[];
}

export interface AiTextRewriteRequest {
  readonly text: string;
  readonly tone: "concise" | "formal" | "friendly";
}

export interface AiTextRewriteResponse {
  readonly rewrittenText: string;
}

export interface AiDashboardQueryRequest {
  readonly question: string;
  readonly dateRange?: DateRange;
}

export interface AiDashboardQueryResponse {
  readonly answer: string;
  readonly relatedMetrics: string[];
}

export interface AiIncidentsDraftRequest {
  readonly incidentSummary: string;
  readonly severity: AlertSeverity;
}

export interface AiIncidentsDraftResponse {
  readonly draftTitle: string;
  readonly draftBody: string;
}

export interface PondsListQueryRequest extends ListQueryRequest {
  readonly farmId?: EntityId;
  readonly status?: PondSummary["status"];
  readonly kind?: PondSummary["kind"];
}

export interface AlertsListQueryRequest extends ListQueryRequest {
  readonly pondId?: EntityId;
  readonly severity?: AlertSummary["severity"];
  readonly status?: AlertSummary["status"];
  readonly source?: string;
  readonly assignedTo?: EntityId;
  readonly reviewState?: AlertReviewState;
  readonly hasLatestNote?: boolean;
  readonly sortBy?: "updatedAt_desc" | "updatedAt_asc" | "createdAt_desc" | "createdAt_asc";
}

export const alertQueuePresetDefinitions: readonly AlertQueuePresetDefinition[] = [
  {
    id: "all_open",
    label: "All open",
    description: "Show open operational alerts across the queue.",
    query: {
      status: "open",
      sortBy: "updatedAt_desc"
    }
  },
  {
    id: "assigned_to_me",
    label: "Assigned to me",
    description: "Focus on the alerts owned by the active operator placeholder.",
    query: {
      assignedTo: "__current_user__",
      sortBy: "updatedAt_desc"
    },
    requiresAssignedTo: true
  },
  {
    id: "under_review",
    label: "Under review",
    description: "Highlight alerts already being actively reviewed.",
    query: {
      reviewState: "under_review",
      sortBy: "updatedAt_desc"
    }
  },
  {
    id: "with_notes",
    label: "With notes",
    description: "Surface alerts that already carry the latest operator note.",
    query: {
      hasLatestNote: true,
      sortBy: "updatedAt_desc"
    }
  },
  {
    id: "resolved_recently",
    label: "Resolved recently",
    description: "Review recently resolved alerts in newest-first order.",
    query: {
      status: "resolved",
      sortBy: "updatedAt_desc"
    }
  }
] as const;

export interface TasksListQueryRequest extends ListQueryRequest {
  readonly assigneeId?: EntityId;
  readonly pondId?: EntityId;
  readonly status?: TaskSummary["status"];
}

export interface AttachmentsListQueryRequest extends ListQueryRequest {
  readonly resourceType?: string;
  readonly resourceId?: EntityId;
}

export interface BatchesListQueryRequest extends ListQueryRequest {
  readonly pondId?: EntityId;
  readonly lifecycleStage?: BatchSummary["lifecycleStage"];
}

export interface FeedListQueryRequest extends ListQueryRequest {
  readonly pondId?: EntityId;
  readonly batchId?: EntityId;
  readonly feedType?: string;
}

export interface AuditListQueryRequest extends ListQueryRequest {
  readonly resourceType?: string;
  readonly resourceId?: EntityId;
  readonly action?: AuditEvent["action"];
}

export interface WaterQualityListQueryRequest extends ListQueryRequest {
  readonly pondId?: EntityId;
  readonly metric?: "temperatureC" | "ph";
}

export interface AiResponseLogListQueryRequest extends ListQueryRequest {
  readonly requestId?: EntityId;
  readonly status?: AiResponseRecord["status"];
  readonly model?: string;
}

export type PlaceholderMutationRequest = {
  readonly id?: EntityId;
};

export type HttpMethod = "GET" | "POST" | "PATCH";
export type EndpointSemantics = "list" | "detail" | "create" | "update" | "action";

export interface EndpointContract<TRequest, TResponse> {
  readonly id: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly semantics: EndpointSemantics;
  readonly __request?: TRequest;
  readonly __response?: TResponse;
}

export type EndpointRequest<TEndpoint> = TEndpoint extends EndpointContract<infer TRequest, unknown>
  ? TRequest
  : never;

export type EndpointResponse<TEndpoint> = TEndpoint extends EndpointContract<unknown, infer TResponse>
  ? TResponse
  : never;

export function defineEndpoint<TRequest, TResponse>(
  contract: Omit<EndpointContract<TRequest, TResponse>, "__request" | "__response">
): EndpointContract<TRequest, TResponse> {
  return contract;
}

export const aquaPulseEndpointCatalog = {
  auth: {
    session: defineEndpoint<Record<string, never>, ApiSuccessEnvelope<CurrentSessionPayload>>({
      id: "auth.session",
      method: "GET",
      path: "/api/auth/session",
      semantics: "detail"
    })
  },
  ponds: {
    create: defineEndpoint<PlaceholderMutationRequest, ApiSuccessEnvelope<PondSummary>>({
      id: "ponds.create",
      method: "POST",
      path: "/api/ponds",
      semantics: "create"
    }),
    list: defineEndpoint<PondsListQueryRequest, ApiSuccessEnvelope<ListResponse<PondSummary>>>({
      id: "ponds.list",
      method: "GET",
      path: "/api/ponds",
      semantics: "list"
    }),
    getById: defineEndpoint<{ readonly id: EntityId }, ApiSuccessEnvelope<PondSummary>>({
      id: "ponds.getById",
      method: "GET",
      path: "/api/ponds/:id",
      semantics: "detail"
    }),
    update: defineEndpoint<{ readonly id: EntityId; readonly body?: PlaceholderMutationRequest }, ApiSuccessEnvelope<PondSummary>>({
      id: "ponds.update",
      method: "PATCH",
      path: "/api/ponds/:id",
      semantics: "update"
    }),
    summarize: defineEndpoint<AiPondsSummarizeRequest, ApiSuccessEnvelope<AiPondsSummarizeResponse>>({
      id: "ai.ponds.summarize",
      method: "POST",
      path: "/api/ai/ponds/summarize",
      semantics: "action"
    })
  },
  alerts: {
    create: defineEndpoint<PlaceholderMutationRequest, ApiSuccessEnvelope<AlertSummary>>({
      id: "alerts.create",
      method: "POST",
      path: "/api/alerts",
      semantics: "create"
    }),
    list: defineEndpoint<AlertsListQueryRequest, ApiSuccessEnvelope<ListResponse<AlertSummary>>>({
      id: "alerts.list",
      method: "GET",
      path: "/api/alerts",
      semantics: "list"
    }),
    summary: defineEndpoint<AlertsListQueryRequest, ApiSuccessEnvelope<AlertQueueSummary>>({
      id: "alerts.summary",
      method: "GET",
      path: "/api/alerts/summary",
      semantics: "detail"
    }),
    getById: defineEndpoint<{ readonly id: EntityId }, ApiSuccessEnvelope<AlertSummary>>({
      id: "alerts.getById",
      method: "GET",
      path: "/api/alerts/:id",
      semantics: "detail"
    }),
    update: defineEndpoint<{ readonly id: EntityId; readonly body?: PlaceholderMutationRequest }, ApiSuccessEnvelope<AlertSummary>>({
      id: "alerts.update",
      method: "PATCH",
      path: "/api/alerts/:id",
      semantics: "update"
    }),
    acknowledge: defineEndpoint<
      { readonly id: EntityId; readonly body: AlertLifecycleActionRequest },
      ApiSuccessEnvelope<AlertSummary>
    >({
      id: "alerts.acknowledge",
      method: "POST",
      path: "/api/alerts/:id/acknowledge",
      semantics: "action"
    }),
    bulkAcknowledge: defineEndpoint<AlertBulkLifecycleActionRequest, ApiSuccessEnvelope<AlertBulkActionResult>>({
      id: "alerts.bulkAcknowledge",
      method: "POST",
      path: "/api/alerts/bulk/acknowledge",
      semantics: "action"
    }),
    resolve: defineEndpoint<
      { readonly id: EntityId; readonly body: AlertLifecycleActionRequest },
      ApiSuccessEnvelope<AlertSummary>
    >({
      id: "alerts.resolve",
      method: "POST",
      path: "/api/alerts/:id/resolve",
      semantics: "action"
    }),
    bulkResolve: defineEndpoint<AlertBulkLifecycleActionRequest, ApiSuccessEnvelope<AlertBulkActionResult>>({
      id: "alerts.bulkResolve",
      method: "POST",
      path: "/api/alerts/bulk/resolve",
      semantics: "action"
    }),
    assign: defineEndpoint<
      { readonly id: EntityId; readonly body: AlertAssignActionRequest },
      ApiSuccessEnvelope<AlertSummary>
    >({
      id: "alerts.assign",
      method: "POST",
      path: "/api/alerts/:id/assign",
      semantics: "action"
    }),
    bulkAssign: defineEndpoint<AlertBulkAssignActionRequest, ApiSuccessEnvelope<AlertBulkActionResult>>({
      id: "alerts.bulkAssign",
      method: "POST",
      path: "/api/alerts/bulk/assign",
      semantics: "action"
    }),
    unassign: defineEndpoint<
      { readonly id: EntityId; readonly body: AlertUnassignActionRequest },
      ApiSuccessEnvelope<AlertSummary>
    >({
      id: "alerts.unassign",
      method: "POST",
      path: "/api/alerts/:id/unassign",
      semantics: "action"
    }),
    setReviewState: defineEndpoint<
      { readonly id: EntityId; readonly body: AlertReviewStateActionRequest },
      ApiSuccessEnvelope<AlertSummary>
    >({
      id: "alerts.setReviewState",
      method: "POST",
      path: "/api/alerts/:id/review-state",
      semantics: "action"
    }),
    bulkSetReviewState: defineEndpoint<
      AlertBulkReviewStateActionRequest,
      ApiSuccessEnvelope<AlertBulkActionResult>
    >({
      id: "alerts.bulkSetReviewState",
      method: "POST",
      path: "/api/alerts/bulk/review-state",
      semantics: "action"
    }),
    listSavedViews: defineEndpoint<Record<string, never>, ApiSuccessEnvelope<AlertSavedViewDefinition[]>>({
      id: "alerts.listSavedViews",
      method: "GET",
      path: "/api/alerts/views",
      semantics: "list"
    }),
    saveSavedView: defineEndpoint<AlertSavedViewCreateRequest, ApiSuccessEnvelope<AlertSavedViewDefinition[]>>({
      id: "alerts.saveSavedView",
      method: "POST",
      path: "/api/alerts/views",
      semantics: "create"
    }),
    removeSavedView: defineEndpoint<{ readonly id: EntityId }, ApiSuccessEnvelope<AlertSavedViewDefinition[]>>({
      id: "alerts.removeSavedView",
      method: "POST",
      path: "/api/alerts/views/:id/remove",
      semantics: "action"
    }),
    attachExplanation: defineEndpoint<
      { readonly id: EntityId; readonly body: AlertExplanationAttachmentRequest },
      ApiSuccessEnvelope<AlertSummary>
    >({
      id: "alerts.attachExplanation",
      method: "POST",
      path: "/api/alerts/:id/attach-explanation",
      semantics: "action"
    }),
    explain: defineEndpoint<AiAlertsExplainRequest, ApiSuccessEnvelope<AiAlertsExplainResponse>>({
      id: "ai.alerts.explain",
      method: "POST",
      path: "/api/ai/alerts/explain",
      semantics: "action"
    }),
    submitExplanationFeedback: defineEndpoint<
      AlertExplanationFeedbackRequest,
      ApiSuccessEnvelope<AlertExplanationFeedbackRecord>
    >({
      id: "ai.alerts.submitExplanationFeedback",
      method: "POST",
      path: "/api/ai/alerts/explain/feedback",
      semantics: "action"
    })
  },
  tasks: {
    create: defineEndpoint<TaskCreateRequest, ApiSuccessEnvelope<TaskSummary>>({
      id: "tasks.create",
      method: "POST",
      path: "/api/tasks",
      semantics: "create"
    }),
    list: defineEndpoint<TasksListQueryRequest, ApiSuccessEnvelope<ListResponse<TaskSummary>>>({
      id: "tasks.list",
      method: "GET",
      path: "/api/tasks",
      semantics: "list"
    }),
    getById: defineEndpoint<{ readonly id: EntityId }, ApiSuccessEnvelope<TaskSummary>>({
      id: "tasks.getById",
      method: "GET",
      path: "/api/tasks/:id",
      semantics: "detail"
    }),
    update: defineEndpoint<{ readonly id: EntityId; readonly body: TaskUpdateRequest }, ApiSuccessEnvelope<TaskSummary>>({
      id: "tasks.update",
      method: "PATCH",
      path: "/api/tasks/:id",
      semantics: "update"
    })
  },
  attachments: {
    create: defineEndpoint<PlaceholderMutationRequest, ApiSuccessEnvelope<AttachmentMetadata>>({
      id: "attachments.create",
      method: "POST",
      path: "/api/attachments",
      semantics: "create"
    }),
    list: defineEndpoint<AttachmentsListQueryRequest, ApiSuccessEnvelope<ListResponse<AttachmentMetadata>>>({
      id: "attachments.list",
      method: "GET",
      path: "/api/attachments",
      semantics: "list"
    }),
    getById: defineEndpoint<{ readonly id: EntityId }, ApiSuccessEnvelope<AttachmentMetadata>>({
      id: "attachments.getById",
      method: "GET",
      path: "/api/attachments/:id",
      semantics: "detail"
    }),
    update: defineEndpoint<{ readonly id: EntityId; readonly body?: PlaceholderMutationRequest }, ApiSuccessEnvelope<AttachmentMetadata>>({
      id: "attachments.update",
      method: "PATCH",
      path: "/api/attachments/:id",
      semantics: "update"
    })
  },
  batches: {
    create: defineEndpoint<PlaceholderMutationRequest, ApiSuccessEnvelope<BatchSummary>>({
      id: "batches.create",
      method: "POST",
      path: "/api/batches",
      semantics: "create"
    }),
    list: defineEndpoint<BatchesListQueryRequest, ApiSuccessEnvelope<ListResponse<BatchSummary>>>({
      id: "batches.list",
      method: "GET",
      path: "/api/batches",
      semantics: "list"
    }),
    getById: defineEndpoint<{ readonly id: EntityId }, ApiSuccessEnvelope<BatchSummary>>({
      id: "batches.getById",
      method: "GET",
      path: "/api/batches/:id",
      semantics: "detail"
    }),
    update: defineEndpoint<{ readonly id: EntityId; readonly body?: PlaceholderMutationRequest }, ApiSuccessEnvelope<BatchSummary>>({
      id: "batches.update",
      method: "PATCH",
      path: "/api/batches/:id",
      semantics: "update"
    })
  },
  feed: {
    create: defineEndpoint<FeedCreateRequest, ApiSuccessEnvelope<FeedEntry>>({
      id: "feed.create",
      method: "POST",
      path: "/api/feed",
      semantics: "create"
    }),
    list: defineEndpoint<FeedListQueryRequest, ApiSuccessEnvelope<ListResponse<FeedEntry>>>({
      id: "feed.list",
      method: "GET",
      path: "/api/feed",
      semantics: "list"
    }),
    getById: defineEndpoint<{ readonly id: EntityId }, ApiSuccessEnvelope<FeedEntry>>({
      id: "feed.getById",
      method: "GET",
      path: "/api/feed/:id",
      semantics: "detail"
    }),
    update: defineEndpoint<{ readonly id: EntityId; readonly body: FeedUpdateRequest }, ApiSuccessEnvelope<FeedEntry>>({
      id: "feed.update",
      method: "PATCH",
      path: "/api/feed/:id",
      semantics: "update"
    })
  },
  audit: {
    create: defineEndpoint<PlaceholderMutationRequest, ApiSuccessEnvelope<AuditEvent>>({
      id: "audit.create",
      method: "POST",
      path: "/api/audit",
      semantics: "create"
    }),
    list: defineEndpoint<AuditListQueryRequest, ApiSuccessEnvelope<ListResponse<AuditEvent>>>({
      id: "audit.list",
      method: "GET",
      path: "/api/audit",
      semantics: "list"
    }),
    getById: defineEndpoint<{ readonly id: EntityId }, ApiSuccessEnvelope<AuditEvent>>({
      id: "audit.getById",
      method: "GET",
      path: "/api/audit/:id",
      semantics: "detail"
    }),
    update: defineEndpoint<{ readonly id: EntityId; readonly body?: PlaceholderMutationRequest }, ApiSuccessEnvelope<AuditEvent>>({
      id: "audit.update",
      method: "PATCH",
      path: "/api/audit/:id",
      semantics: "update"
    })
  },
  waterQuality: {
    create: defineEndpoint<WaterQualityCreateRequest, ApiSuccessEnvelope<WaterQualityReading>>({
      id: "waterQuality.create",
      method: "POST",
      path: "/api/water-quality",
      semantics: "create"
    }),
    list: defineEndpoint<WaterQualityListQueryRequest, ApiSuccessEnvelope<ListResponse<WaterQualityReading>>>({
      id: "waterQuality.list",
      method: "GET",
      path: "/api/water-quality",
      semantics: "list"
    }),
    getById: defineEndpoint<{ readonly id: EntityId }, ApiSuccessEnvelope<WaterQualityReading>>({
      id: "waterQuality.getById",
      method: "GET",
      path: "/api/water-quality/:id",
      semantics: "detail"
    }),
    update: defineEndpoint<{ readonly id: EntityId; readonly body?: PlaceholderMutationRequest }, ApiSuccessEnvelope<WaterQualityReading>>({
      id: "waterQuality.update",
      method: "PATCH",
      path: "/api/water-quality/:id",
      semantics: "update"
    })
  },
  ai: {
    create: defineEndpoint<PlaceholderMutationRequest, ApiSuccessEnvelope<AiResponseRecord>>({
      id: "ai.create",
      method: "POST",
      path: "/api/ai",
      semantics: "create"
    }),
    list: defineEndpoint<AiResponseLogListQueryRequest, ApiSuccessEnvelope<ListResponse<AiResponseRecord>>>({
      id: "ai.list",
      method: "GET",
      path: "/api/ai",
      semantics: "list"
    }),
    getById: defineEndpoint<{ readonly id: EntityId }, ApiSuccessEnvelope<AiResponseRecord>>({
      id: "ai.getById",
      method: "GET",
      path: "/api/ai/:id",
      semantics: "detail"
    }),
    update: defineEndpoint<{ readonly id: EntityId; readonly body?: PlaceholderMutationRequest }, ApiSuccessEnvelope<AiResponseRecord>>({
      id: "ai.update",
      method: "PATCH",
      path: "/api/ai/:id",
      semantics: "update"
    }),
    explainAlert: defineEndpoint<AiAlertsExplainRequest, ApiSuccessEnvelope<AiAlertsExplainResponse>>({
      id: "ai.explainAlert",
      method: "POST",
      path: "/api/ai/alerts/explain",
      semantics: "action"
    }),
    summarizePond: defineEndpoint<AiPondsSummarizeRequest, ApiSuccessEnvelope<AiPondsSummarizeResponse>>({
      id: "ai.summarizePond",
      method: "POST",
      path: "/api/ai/ponds/summarize",
      semantics: "action"
    }),
    generateHandover: defineEndpoint<AiHandoverGenerateRequest, ApiSuccessEnvelope<AiHandoverGenerateResponse>>({
      id: "ai.generateHandover",
      method: "POST",
      path: "/api/ai/handover/generate",
      semantics: "action"
    }),
    rewriteText: defineEndpoint<AiTextRewriteRequest, ApiSuccessEnvelope<AiTextRewriteResponse>>({
      id: "ai.rewriteText",
      method: "POST",
      path: "/api/ai/text/rewrite",
      semantics: "action"
    }),
    queryDashboard: defineEndpoint<AiDashboardQueryRequest, ApiSuccessEnvelope<AiDashboardQueryResponse>>({
      id: "ai.queryDashboard",
      method: "POST",
      path: "/api/ai/dashboard/query",
      semantics: "action"
    }),
    draftIncident: defineEndpoint<AiIncidentsDraftRequest, ApiSuccessEnvelope<AiIncidentsDraftResponse>>({
      id: "ai.draftIncident",
      method: "POST",
      path: "/api/ai/incidents/draft",
      semantics: "action"
    })
  }
} as const;

function buildOperationalAlertKey(
  source: OperationalAlertSource,
  ruleCode: OperationalAlertRuleCode,
  pondId?: EntityId
): string {
  return [source, ruleCode, pondId ?? "global"].join(":");
}

export function evaluateWaterQualityAlertDecisions(
  input: Pick<WaterQualityCreateRequest, "pondId" | "recordedAt" | "temperatureC" | "ph">
): OperationalAlertDecision[] {
  const decisions: OperationalAlertDecision[] = [];
  const missingTemperature = input.temperatureC === undefined;
  const missingPh = input.ph === undefined;

  if (missingTemperature || missingPh) {
    const missingFields = [missingTemperature ? "temperature" : null, missingPh ? "ph" : null]
      .filter(Boolean)
      .join(" and ");

    decisions.push({
      ruleCode: "water_quality_missing_critical_values",
      title: "Missing critical water-quality reading",
      severity: "critical",
      source: "water-quality",
      pondId: input.pondId,
      status: "open",
      summary: `Missing ${missingFields} reading for pond ${input.pondId}.`,
      dedupeKey: buildOperationalAlertKey("water-quality", "water_quality_missing_critical_values", input.pondId),
      observedAt: input.recordedAt
    });
  }

  const breachedTemperature =
    input.temperatureC !== undefined && (input.temperatureC < 26 || input.temperatureC > 32);
  const breachedPh = input.ph !== undefined && (input.ph < 6.5 || input.ph > 8.5);

  if (breachedTemperature || breachedPh) {
    const parts: string[] = [];
    if (breachedTemperature) {
      parts.push(`temperature ${input.temperatureC}`);
    }
    if (breachedPh) {
      parts.push(`ph ${input.ph}`);
    }

    decisions.push({
      ruleCode: "water_quality_threshold_breach",
      title: "Water-quality threshold breach",
      severity: "high",
      source: "water-quality",
      pondId: input.pondId,
      status: "open",
      summary: `Threshold breach detected for ${parts.join(" and ")} in pond ${input.pondId}.`,
      dedupeKey: buildOperationalAlertKey("water-quality", "water_quality_threshold_breach", input.pondId),
      observedAt: input.recordedAt
    });
  }

  return decisions;
}

export function evaluateFeedAlertDecisions(
  input: Pick<FeedCreateRequest, "pondId" | "quantityKg" | "fedAt">
): OperationalAlertDecision[] {
  if (input.quantityKg < 80) {
    return [];
  }

  return [
    {
      ruleCode: "feed_quantity_anomaly",
      title: "Feed quantity anomaly detected",
      severity: "medium",
      source: "feed",
      pondId: input.pondId,
      status: "open",
      summary: `Feed quantity ${input.quantityKg}kg looks unusually high for pond ${input.pondId}.`,
      dedupeKey: buildOperationalAlertKey("feed", "feed_quantity_anomaly", input.pondId),
      observedAt: input.fedAt
    }
  ];
}

export function findMatchingOperationalAlert(
  alerts: readonly AlertSummary[],
  decision: OperationalAlertDecision
): AlertSummary | undefined {
  return alerts.find(
    (alert) =>
      alert.status === "open" &&
      alert.source === decision.source &&
      alert.pondId === decision.pondId &&
      `${alert.source}:${decision.ruleCode}:${alert.pondId ?? "global"}` === decision.dedupeKey
  );
}

export function buildAlertQueueSummary(items: readonly AlertSummary[]): AlertQueueSummary {
  let open = 0;
  let acknowledged = 0;
  let resolved = 0;
  let assigned = 0;
  let unassigned = 0;
  let unreviewed = 0;
  let underReview = 0;
  let reviewed = 0;
  let deferred = 0;
  let withLatestNote = 0;
  let withoutLatestNote = 0;
  let low = 0;
  let medium = 0;
  let high = 0;
  let critical = 0;

  const ownerWorkloads = new Map<string, AlertOwnerWorkloadSummary>();

  for (const item of items) {
    if (item.status === "open") open += 1;
    if (item.status === "acknowledged") acknowledged += 1;
    if (item.status === "resolved") resolved += 1;

    if (item.assignedTo) {
      assigned += 1;

      const current = ownerWorkloads.get(item.assignedTo) ?? {
        ownerId: item.assignedTo,
        assignedAlerts: 0,
        openAlerts: 0,
        underReviewAlerts: 0,
        unresolvedAlerts: 0
      };

      ownerWorkloads.set(item.assignedTo, {
        ownerId: item.assignedTo,
        assignedAlerts: current.assignedAlerts + 1,
        openAlerts: current.openAlerts + (item.status === "open" ? 1 : 0),
        underReviewAlerts:
          current.underReviewAlerts + ((item.reviewState ?? "unreviewed") === "under_review" ? 1 : 0),
        unresolvedAlerts: current.unresolvedAlerts + (item.status !== "resolved" ? 1 : 0)
      });
    } else {
      unassigned += 1;
    }

    switch (item.reviewState ?? "unreviewed") {
      case "under_review":
        underReview += 1;
        break;
      case "reviewed":
        reviewed += 1;
        break;
      case "deferred":
        deferred += 1;
        break;
      case "unreviewed":
      default:
        unreviewed += 1;
        break;
    }

    if (item.latestNote?.trim()) withLatestNote += 1;
    else withoutLatestNote += 1;

    if (item.severity === "low") low += 1;
    if (item.severity === "medium") medium += 1;
    if (item.severity === "high") high += 1;
    if (item.severity === "critical") critical += 1;
  }

  return {
    totalAlerts: items.length,
    statusCounts: { open, acknowledged, resolved },
    assignmentCounts: { assigned, unassigned },
    reviewStateCounts: { unreviewed, underReview, reviewed, deferred },
    noteCounts: { withLatestNote, withoutLatestNote },
    severityCounts: { low, medium, high, critical },
    ownerWorkloads: [...ownerWorkloads.values()].sort((left, right) => left.ownerId.localeCompare(right.ownerId))
  };
}

export type RuntimeHealthStatus = "ok" | "degraded";
export type RuntimeServiceIdentity = "api" | "web";
export type RuntimeConnectionCheckStatus = "not_attempted" | "configured_only" | "reachable" | "unreachable";
export type RuntimeTransportMode = "mock" | "proxy" | "direct";
export type RuntimeProbeStatus = "disabled" | "reachable" | "partial" | "unreachable";
export type AquaPulseAuthMode = "disabled" | "local" | "keycloak";
export type AquaPulseAuthProvider = "local" | "keycloak";
export type AlertsLiveUpdatesConnectionState =
  | "disabled"
  | "inactive"
  | "connecting"
  | "active"
  | "degraded"
  | "unavailable";
export type AlertsLiveUpdatesSubscriptionAuthState =
  | "disabled"
  | "bypassed_local"
  | "authenticated"
  | "degraded"
  | "unavailable";
export type AlertsLiveUpdatesSubscriptionTransport =
  | "direct"
  | "local_proxy_bootstrap";
export type AlertsLiveUpdatesCredentialMode =
  | "none"
  | "direct_bearer"
  | "ephemeral_ticket";
export type AlertsLiveUpdatesGatewayPolicy =
  | "disabled"
  | "bypassed_local"
  | "authenticated_operator_required";
export type AlertsLiveUpdatesLastSubscriptionState =
  | "authenticated"
  | "bypassed_local"
  | "ticket_authenticated"
  | "ticket_bypassed_local"
  | "rejected_invalid_ticket"
  | "rejected_expired_ticket"
  | "rejected_missing_auth"
  | "rejected_invalid_auth"
  | "rejected_insufficient_access";
export type AlertLiveUpdateEventType =
  | "alert_created"
  | "alert_updated"
  | "alert_lifecycle_changed"
  | "alert_bulk_action_completed"
  | "alert_summary_changed";

export interface RuntimeWarning {
  readonly code: string;
  readonly message: string;
}

export interface RuntimeModeSummary {
  readonly defaultMode: "mock" | "in-memory";
  readonly requestedMode?: string;
  readonly effectiveMode: string;
  readonly safeFallbackActive: boolean;
}

export interface AuthenticatedUserSession {
  readonly id: EntityId;
  readonly subject?: string;
  readonly username?: string;
  readonly displayName?: string;
  readonly email?: string;
  readonly provider: AquaPulseAuthProvider;
  readonly roles: string[];
  readonly permissions: string[];
  readonly claims: Record<string, string | number | boolean | string[] | undefined>;
}

export interface FrontendAuthRuntimeDiagnostics {
  readonly requestedMode: AquaPulseAuthMode;
  readonly effectiveMode: AquaPulseAuthMode;
  readonly active: boolean;
  readonly bypassActive: boolean;
  readonly keycloakConfigured: boolean;
  readonly verificationAvailable: boolean;
  readonly verificationState:
    | "disabled"
    | "local_bypass"
    | "keycloak_incomplete"
    | "jwks_ready";
  readonly issuerLabel: string;
  readonly jwksLabel: string;
  readonly realm?: string;
  readonly clientId?: string;
  readonly firstProtectedSliceLabel: string;
  readonly firstProtectedSliceEnforced: boolean;
  readonly protectedReadSliceLabel?: string;
  readonly protectedReadSliceEnforced: boolean;
  readonly secondaryProtectedReadSliceLabel?: string;
  readonly secondaryProtectedReadSliceEnforced: boolean;
  readonly tertiaryProtectedReadSliceLabel?: string;
  readonly tertiaryProtectedReadSliceEnforced: boolean;
  readonly protectedOperatorSliceLabel: string;
  readonly protectedOperatorSliceEnforced: boolean;
  readonly secondaryProtectedSliceLabel?: string;
  readonly secondaryProtectedSliceEnforced: boolean;
  readonly tertiaryProtectedSliceLabel?: string;
  readonly tertiaryProtectedSliceEnforced: boolean;
  readonly quaternaryProtectedSliceLabel?: string;
  readonly quaternaryProtectedSliceEnforced: boolean;
  readonly forwardingMode:
    | "bypassed"
    | "proxy_env_token"
    | "proxy_cookie"
    | "proxy_header_passthrough"
    | "unavailable";
  readonly forwardingActive: boolean;
  readonly forwardedAuthPresent: boolean;
  readonly localDevUserLabel: string;
  readonly warnings: RuntimeWarning[];
}

export interface CurrentSessionUserSummary {
  readonly id: EntityId;
  readonly username?: string;
  readonly displayName?: string;
  readonly email?: string;
  readonly provider: "local" | "keycloak";
  readonly roles: string[];
  readonly permissions: string[];
  readonly claimKeys: string[];
  readonly alertsAccessLevel: "none" | "viewer" | "operator";
  readonly operatorAccess: boolean;
  readonly alertsAccessSource:
    | "none"
    | "viewer_only"
    | "operator_role"
    | "alerts_operate_permission";
}

export type CurrentSessionAvailabilityState =
  | "disabled"
  | "local_user"
  | "authenticated_user"
  | "unauthenticated"
  | "degraded";

export type CurrentSessionAuthSource =
  | "none"
  | "local_dev_headers"
  | "local_default_user"
  | "keycloak_bearer"
  | "keycloak_missing_bearer";

export interface CurrentSessionPayload {
  readonly requestedMode: AquaPulseAuthMode;
  readonly effectiveMode: AquaPulseAuthMode;
  readonly availabilityState: CurrentSessionAvailabilityState;
  readonly authSource: CurrentSessionAuthSource;
  readonly user?: CurrentSessionUserSummary;
  readonly sessionPresent: boolean;
  readonly protectedReadSliceLabel?: string;
  readonly protectedReadSliceEnforced: boolean;
  readonly secondaryProtectedReadSliceLabel?: string;
  readonly secondaryProtectedReadSliceEnforced: boolean;
  readonly tertiaryProtectedReadSliceLabel?: string;
  readonly tertiaryProtectedReadSliceEnforced: boolean;
  readonly protectedOperatorSliceLabel: string;
  readonly protectedOperatorSliceEnforced: boolean;
  readonly secondaryProtectedSliceLabel?: string;
  readonly secondaryProtectedSliceEnforced: boolean;
  readonly tertiaryProtectedSliceLabel?: string;
  readonly tertiaryProtectedSliceEnforced: boolean;
  readonly quaternaryProtectedSliceLabel?: string;
  readonly quaternaryProtectedSliceEnforced: boolean;
  readonly verificationState:
    | "disabled"
    | "local_bypass"
    | "not_configured"
    | "ready"
    | "verified"
    | "degraded";
  readonly warnings: RuntimeWarning[];
}

export interface FrontendSessionBootstrapStatus {
  readonly bootstrapEnabled: boolean;
  readonly bootstrapState: "active" | "bypassed" | "degraded" | "unavailable";
  readonly sourceOfTruth: "runtime_derived" | "backend_session";
  readonly currentSessionEndpointStatus:
    | "not_requested"
    | "available"
    | "unreachable"
    | "degraded";
  readonly currentSessionAvailable: boolean;
  readonly availabilityState: CurrentSessionAvailabilityState;
  readonly requestedMode: AquaPulseAuthMode;
  readonly effectiveMode: AquaPulseAuthMode;
  readonly sessionPresent: boolean;
  readonly forwardedAuthPresent: boolean;
  readonly forwardingActive: boolean;
  readonly forwardingMode:
    | "bypassed"
    | "proxy_env_token"
    | "proxy_cookie"
    | "proxy_header_passthrough"
    | "unavailable";
  readonly protectedReadGuardedSliceLabel?: string;
  readonly protectedReadGuardedSliceEnforced: boolean;
  readonly secondaryProtectedReadGuardedSliceLabel?: string;
  readonly secondaryProtectedReadGuardedSliceEnforced: boolean;
  readonly tertiaryProtectedReadGuardedSliceLabel?: string;
  readonly tertiaryProtectedReadGuardedSliceEnforced: boolean;
  readonly protectedOperatorSliceLabel: string;
  readonly protectedOperatorUiState: "enabled" | "disabled" | "bypassed";
  readonly secondaryGuardedSliceLabel?: string;
  readonly secondaryGuardedSliceEnforced: boolean;
  readonly tertiaryGuardedSliceLabel?: string;
  readonly tertiaryGuardedSliceEnforced: boolean;
  readonly quaternaryGuardedSliceLabel?: string;
  readonly quaternaryGuardedSliceEnforced: boolean;
  readonly currentUser?: CurrentSessionUserSummary;
  readonly warnings: RuntimeWarning[];
}

export interface BackendAuthRuntimeDiagnostics {
  readonly requestedMode: AquaPulseAuthMode;
  readonly effectiveMode: AquaPulseAuthMode;
  readonly active: boolean;
  readonly bypassActive: boolean;
  readonly keycloakConfigured: boolean;
  readonly verificationAvailable: boolean;
  readonly verificationActive: boolean;
  readonly verificationBypassed: boolean;
  readonly issuerLabel: string;
  readonly jwksLabel: string;
  readonly realm?: string;
  readonly clientId?: string;
  readonly validationStrategy: "disabled" | "local_headers" | "keycloak_bearer_claims";
  readonly tokenValidation:
    | "not_applicable"
    | "not_attempted"
    | "jwks_ready"
    | "verified"
    | "verification_failed";
  readonly verificationStatus:
    | "disabled"
    | "local_bypass"
    | "not_configured"
    | "ready"
    | "verified"
    | "degraded";
  readonly lastVerificationAt?: ISODateString;
  readonly lastVerificationMessage?: string;
  readonly firstProtectedSliceLabel: string;
  readonly firstProtectedSliceEnforced: boolean;
  readonly protectedReadSliceLabel?: string;
  readonly protectedReadSliceEnforced: boolean;
  readonly secondaryProtectedReadSliceLabel?: string;
  readonly secondaryProtectedReadSliceEnforced: boolean;
  readonly tertiaryProtectedReadSliceLabel?: string;
  readonly tertiaryProtectedReadSliceEnforced: boolean;
  readonly protectedOperatorSliceLabel: string;
  readonly protectedOperatorSliceEnforced: boolean;
  readonly secondaryProtectedSliceLabel?: string;
  readonly secondaryProtectedSliceEnforced: boolean;
  readonly tertiaryProtectedSliceLabel?: string;
  readonly tertiaryProtectedSliceEnforced: boolean;
  readonly quaternaryProtectedSliceLabel?: string;
  readonly quaternaryProtectedSliceEnforced: boolean;
  readonly defaultLocalUserLabel: string;
  readonly warnings: RuntimeWarning[];
}

export interface DatabaseRuntimeDiagnostics {
  readonly configured: boolean;
  readonly selectedAdapter: "in-memory" | "postgres";
  readonly requestedAdapter?: "in-memory" | "postgres";
  readonly postgresAdaptersEnabled: boolean;
  readonly runtimeSwitchEnabled: boolean;
  readonly schema?: string;
  readonly host?: string;
  readonly port?: number;
  readonly database?: string;
  readonly sslMode?: "disable" | "prefer" | "require";
  readonly healthcheckOnBoot: boolean;
  readonly connectivity: {
    readonly status: RuntimeConnectionCheckStatus;
    readonly message: string;
  };
}

export interface AlertsRuntimeDiagnostics {
  readonly requestedMode: "mock" | "http" | "inherit";
  readonly effectiveMode: "mock" | "http";
  readonly transport: RuntimeTransportMode;
  readonly usesLocalProxy: boolean;
  readonly targetLabel: string;
  readonly scopeLabel: string;
  readonly warnings: RuntimeWarning[];
}

export interface FeedRuntimeDiagnostics {
  readonly requestedMode: "mock" | "http" | "inherit";
  readonly effectiveMode: "mock" | "http";
  readonly transport: RuntimeTransportMode;
  readonly usesLocalProxy: boolean;
  readonly targetLabel: string;
  readonly scopeLabel: string;
  readonly warnings: RuntimeWarning[];
}

export interface PondsRuntimeDiagnostics {
  readonly requestedMode: "mock" | "http" | "inherit";
  readonly effectiveMode: "mock" | "http";
  readonly transport: RuntimeTransportMode;
  readonly usesLocalProxy: boolean;
  readonly targetLabel: string;
  readonly scopeLabel: string;
  readonly warnings: RuntimeWarning[];
}

export interface WaterQualityRuntimeDiagnostics {
  readonly requestedMode: "mock" | "http" | "inherit";
  readonly effectiveMode: "mock" | "http";
  readonly transport: RuntimeTransportMode;
  readonly usesLocalProxy: boolean;
  readonly targetLabel: string;
  readonly scopeLabel: string;
  readonly warnings: RuntimeWarning[];
}

export interface TasksRuntimeDiagnostics {
  readonly requestedMode: "mock" | "http" | "inherit";
  readonly effectiveMode: "mock" | "http";
  readonly transport: RuntimeTransportMode;
  readonly usesLocalProxy: boolean;
  readonly targetLabel: string;
  readonly scopeLabel: string;
  readonly warnings: RuntimeWarning[];
}

export interface AlertsLiveUpdatesRuntimeDiagnostics {
  readonly requested: boolean;
  readonly enabled: boolean;
  readonly targetLabel: string;
  readonly connectionState: AlertsLiveUpdatesConnectionState;
  readonly subscriptionAuthState: AlertsLiveUpdatesSubscriptionAuthState;
  readonly subscriptionTransport: AlertsLiveUpdatesSubscriptionTransport;
  readonly credentialMode: AlertsLiveUpdatesCredentialMode;
  readonly proxyBootstrapPathLabel?: string;
  readonly proxyBootstrapAvailable: boolean;
  readonly authMode: AquaPulseAuthMode;
  readonly websocketAuthConfigured: boolean;
  readonly currentSessionSufficient: boolean;
  readonly fallbackMode: "manual_refresh";
  readonly warnings: RuntimeWarning[];
}

export interface LocalBridgeDiagnostics {
  readonly routePrefix: string;
  readonly transport: "proxy";
  readonly backendTargetLabel: string;
  readonly configured: boolean;
  readonly warnings: RuntimeWarning[];
}

export interface FrontendRuntimeDiagnostics {
  readonly service: "web";
  readonly mode: RuntimeModeSummary;
  readonly auth: FrontendAuthRuntimeDiagnostics;
  readonly session: FrontendSessionBootstrapStatus;
  readonly alerts: AlertsRuntimeDiagnostics;
  readonly alertsLiveUpdates: AlertsLiveUpdatesRuntimeDiagnostics;
  readonly ponds: PondsRuntimeDiagnostics;
  readonly feed: FeedRuntimeDiagnostics;
  readonly tasks: TasksRuntimeDiagnostics;
  readonly waterQuality: WaterQualityRuntimeDiagnostics;
  readonly localBridge: LocalBridgeDiagnostics;
  readonly warnings: RuntimeWarning[];
}

export interface BackendRuntimeProbeDiagnostics {
  readonly enabled: boolean;
  readonly status: RuntimeProbeStatus;
  readonly targetLabel: string;
  readonly checkedAt?: ISODateString;
  readonly errorMessage?: string;
  readonly health?: BackendHealthDiagnostics;
  readonly runtime?: BackendRuntimeDiagnostics;
  readonly warnings: RuntimeWarning[];
}

export interface BackendAlertsRuntimeDiagnostics {
  readonly workbenchCutoverAvailable: boolean;
  readonly postgresReadCutoverAvailable: boolean;
  readonly postgresWriteCutoverAvailable: boolean;
  readonly requestedAdapter?: "in-memory" | "postgres";
  readonly effectiveAdapter: "in-memory" | "postgres";
  readonly runtimeSwitchEnabled: boolean;
  readonly cutoverActive: boolean;
  readonly databaseConfigured: boolean;
  readonly connectivityStatus: RuntimeConnectionCheckStatus;
  readonly localBridgeExpectedPath: string;
  readonly localAiExplainBridgeExpectedPath: string;
  readonly warnings: RuntimeWarning[];
}

export interface BackendWaterQualityRuntimeDiagnostics {
  readonly postgresReadCutoverAvailable: boolean;
  readonly postgresWriteCutoverAvailable: boolean;
  readonly requestedAdapter?: "in-memory" | "postgres";
  readonly effectiveAdapter: "in-memory" | "postgres";
  readonly runtimeSwitchEnabled: boolean;
  readonly cutoverActive: boolean;
  readonly databaseConfigured: boolean;
  readonly connectivityStatus: RuntimeConnectionCheckStatus;
  readonly warnings: RuntimeWarning[];
}

export interface BackendFeedRuntimeDiagnostics {
  readonly postgresReadCutoverAvailable: boolean;
  readonly postgresWriteCutoverAvailable: boolean;
  readonly requestedAdapter?: "in-memory" | "postgres";
  readonly effectiveAdapter: "in-memory" | "postgres";
  readonly runtimeSwitchEnabled: boolean;
  readonly cutoverActive: boolean;
  readonly databaseConfigured: boolean;
  readonly connectivityStatus: RuntimeConnectionCheckStatus;
  readonly localBridgeExpectedPath: string;
  readonly warnings: RuntimeWarning[];
}

export interface BackendTasksRuntimeDiagnostics {
  readonly postgresReadCutoverAvailable: boolean;
  readonly postgresWriteCutoverAvailable: boolean;
  readonly requestedAdapter?: "in-memory" | "postgres";
  readonly effectiveAdapter: "in-memory" | "postgres";
  readonly runtimeSwitchEnabled: boolean;
  readonly cutoverActive: boolean;
  readonly databaseConfigured: boolean;
  readonly connectivityStatus: RuntimeConnectionCheckStatus;
  readonly warnings: RuntimeWarning[];
}

export interface BackendPondsRuntimeDiagnostics {
  readonly postgresReadCutoverAvailable: boolean;
  readonly postgresWriteCutoverAvailable: boolean;
  readonly requestedAdapter?: "in-memory" | "postgres";
  readonly effectiveAdapter: "in-memory" | "postgres";
  readonly runtimeSwitchEnabled: boolean;
  readonly cutoverActive: boolean;
  readonly databaseConfigured: boolean;
  readonly connectivityStatus: RuntimeConnectionCheckStatus;
  readonly warnings: RuntimeWarning[];
}

export interface AlertLiveUpdateAlertPreview {
  readonly id: EntityId;
  readonly status: AlertSummary["status"];
  readonly severity: AlertSummary["severity"];
  readonly assignedTo?: EntityId;
  readonly reviewState?: AlertReviewState;
  readonly updatedAt: ISODateString;
}

export interface AlertLiveUpdateEvent {
  readonly source: "alerts";
  readonly eventType: AlertLiveUpdateEventType;
  readonly timestamp: ISODateString;
  readonly alertId?: EntityId;
  readonly alertIds?: EntityId[];
  readonly totalUpdated?: number;
  readonly changedFields?: string[];
  readonly alert?: AlertLiveUpdateAlertPreview;
  readonly summary?: AlertQueueSummary;
}

export interface AlertsLiveUpdatesSubscriptionStatus {
  readonly source: "alerts_live_updates";
  readonly kind: "subscription_status";
  readonly timestamp: ISODateString;
  readonly authMode: AquaPulseAuthMode;
  readonly subscriptionAuthState: "authenticated" | "bypassed_local";
  readonly message: string;
}

export interface AlertsLiveUpdatesBootstrapPayload {
  readonly requested: boolean;
  readonly enabled: boolean;
  readonly subscriptionTransport: AlertsLiveUpdatesSubscriptionTransport;
  readonly credentialMode: AlertsLiveUpdatesCredentialMode;
  readonly targetLabel: string;
  readonly webSocketUrl?: string;
  readonly ticketIssued: boolean;
  readonly ticketExpiresAt?: ISODateString;
  readonly subscriptionAuthState: AlertsLiveUpdatesSubscriptionAuthState;
  readonly authMode: AquaPulseAuthMode;
  readonly forwardedAuthPresent: boolean;
  readonly forwardingSource:
    | "env_token"
    | "cookie_token"
    | "authorization_header"
    | "none";
  readonly warnings: RuntimeWarning[];
}

export interface BackendAlertsLiveUpdatesDiagnostics {
  readonly enabled: boolean;
  readonly gatewayPath: string;
  readonly ticketBootstrapPath: string;
  readonly ticketTtlSeconds: number;
  readonly gatewayAttached: boolean;
  readonly activeConnections: number;
  readonly subscriptionPolicy: AlertsLiveUpdatesGatewayPolicy;
  readonly credentialMode: AlertsLiveUpdatesCredentialMode;
  readonly authenticatedConnections: number;
  readonly bypassedConnections: number;
  readonly lastTicketIssuedAt?: ISODateString;
  readonly lastTicketIssuedState?: AlertsLiveUpdatesSubscriptionAuthState;
  readonly lastSubscriptionAt?: ISODateString;
  readonly lastSubscriptionState?: AlertsLiveUpdatesLastSubscriptionState;
  readonly lastSubscriptionReason?: string;
  readonly lastEventAt?: ISODateString;
  readonly warnings: RuntimeWarning[];
}

export interface BackendRuntimeDiagnostics {
  readonly service: "api";
  readonly mode: RuntimeModeSummary;
  readonly auth?: BackendAuthRuntimeDiagnostics;
  readonly database: DatabaseRuntimeDiagnostics;
  readonly aiExplanations: {
    readonly advisoryOnly: true;
    readonly mode: "fallback" | "openai_nano";
    readonly configured: boolean;
    readonly modelLabel: string;
    readonly cacheEnabled: boolean;
    readonly attachmentAvailable: boolean;
    readonly feedbackEnabled: boolean;
    readonly warnings: RuntimeWarning[];
  };
  readonly alerts: BackendAlertsRuntimeDiagnostics;
  readonly alertsLiveUpdates?: BackendAlertsLiveUpdatesDiagnostics;
  readonly ponds?: BackendPondsRuntimeDiagnostics;
  readonly feed?: BackendFeedRuntimeDiagnostics;
  readonly tasks?: BackendTasksRuntimeDiagnostics;
  readonly waterQuality: BackendWaterQualityRuntimeDiagnostics;
  readonly warnings: RuntimeWarning[];
}

export interface BackendHealthDiagnostics {
  readonly ok: boolean;
  readonly status: RuntimeHealthStatus;
  readonly service: RuntimeServiceIdentity;
  readonly version: string;
  readonly timestamp: ISODateString;
  readonly runtime: BackendRuntimeDiagnostics;
}

export function filterAlertsByQuery(
  items: readonly AlertSummary[],
  query: Partial<AlertsListQueryRequest> = {}
): AlertSummary[] {
  const normalizedSearch = query.search?.trim().toLowerCase();

  return items.filter(
    (item) =>
      (!query.pondId || item.pondId === query.pondId) &&
      (!query.severity || item.severity === query.severity) &&
      (!query.status || item.status === query.status) &&
      (!query.source || item.source === query.source) &&
      (!query.assignedTo || item.assignedTo === query.assignedTo) &&
      (!query.reviewState || item.reviewState === query.reviewState) &&
      (query.hasLatestNote === undefined ||
        (query.hasLatestNote ? Boolean(item.latestNote?.trim()) : !item.latestNote?.trim())) &&
      (!normalizedSearch ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.source.toLowerCase().includes(normalizedSearch) ||
        Boolean(item.latestNote?.toLowerCase().includes(normalizedSearch)))
  );
}

export function sortAlertsByQuery(
  items: readonly AlertSummary[],
  sortBy: AlertsListQueryRequest["sortBy"] = "updatedAt_desc"
): AlertSummary[] {
  const sorted = [...items];

  sorted.sort((left, right) => compareAlertsBySort(left, right, sortBy));

  return sorted;
}

function toAlertSortTimestamp(value: string | undefined): number {
  return value ? Date.parse(value) : 0;
}

function compareAlertStrings(left: string | undefined, right: string | undefined): number {
  return (left ?? "").localeCompare(right ?? "");
}

export function compareAlertsBySort(
  left: AlertSummary,
  right: AlertSummary,
  sortBy: AlertsListQueryRequest["sortBy"] = "updatedAt_desc"
): number {
  switch (sortBy) {
    case "createdAt_asc":
      return toAlertSortTimestamp(left.createdAt) - toAlertSortTimestamp(right.createdAt) || compareAlertStrings(left.id, right.id);
    case "updatedAt_asc":
      return toAlertSortTimestamp(left.updatedAt) - toAlertSortTimestamp(right.updatedAt) || compareAlertStrings(left.id, right.id);
    case "createdAt_desc":
      return toAlertSortTimestamp(right.createdAt) - toAlertSortTimestamp(left.createdAt) || compareAlertStrings(right.id, left.id);
    case "updatedAt_desc":
    default:
      return toAlertSortTimestamp(right.updatedAt) - toAlertSortTimestamp(left.updatedAt) || compareAlertStrings(right.id, left.id);
  }
}

export function getAlertQueuePresetQuery(
  presetId: AlertQueuePresetId,
  currentOwnerId = "__current_user__"
): Partial<AlertsListQueryRequest> {
  const preset = alertQueuePresetDefinitions.find((item) => item.id === presetId);
  if (!preset) {
    return {};
  }

  if (preset.requiresAssignedTo) {
    return {
      ...preset.query,
      assignedTo: currentOwnerId
    };
  }

  return preset.query;
}

export function buildAlertSummaryQuery(
  query: Partial<AlertsListQueryRequest>
): Partial<AlertsListQueryRequest> {
  return {
    ...query,
    status: undefined,
    reviewState: undefined
  };
}
