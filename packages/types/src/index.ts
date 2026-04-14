export type EntityId = string;
export type ISODateString = string;
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type SortDirection = "asc" | "desc";

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

export interface AlertSummary extends BaseEntity {
  readonly title: string;
  readonly severity: AlertSeverity;
  readonly source: string;
  readonly pondId?: EntityId;
  readonly status: "open" | "acknowledged" | "resolved";
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
}

export interface AiAlertsExplainResponse {
  readonly explanation: string;
  readonly recommendations: string[];
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
}

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
    explain: defineEndpoint<AiAlertsExplainRequest, ApiSuccessEnvelope<AiAlertsExplainResponse>>({
      id: "ai.alerts.explain",
      method: "POST",
      path: "/api/ai/alerts/explain",
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
    update: defineEndpoint<{ readonly id: EntityId; readonly body?: PlaceholderMutationRequest }, ApiSuccessEnvelope<TaskSummary>>({
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
    update: defineEndpoint<{ readonly id: EntityId; readonly body?: PlaceholderMutationRequest }, ApiSuccessEnvelope<FeedEntry>>({
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
