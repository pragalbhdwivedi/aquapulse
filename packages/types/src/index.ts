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

export interface FeedEntry extends BaseEntity {
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
