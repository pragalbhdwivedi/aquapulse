export type EntityId = string;
export type ISODateString = string;
export type RoleCode = "admin" | "manager" | "supervisor" | "operator" | "viewer";
export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type AuditAction = "create" | "update" | "delete" | "view" | "export";
export type SortDirection = "asc" | "desc";
export type AiRequestKind =
  | "alerts_explain"
  | "ponds_summarize"
  | "handover_generate"
  | "text_rewrite"
  | "dashboard_query"
  | "incidents_draft";
export type AiResponseStatus = "draft" | "completed" | "rejected";

export interface BaseEntity {
  readonly id: EntityId;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

export interface NamedEntity extends BaseEntity {
  readonly name: string;
}

export interface UserSummary extends BaseEntity {
  readonly email: string;
  readonly displayName: string;
  readonly roleIds: EntityId[];
  readonly isActive: boolean;
}

export interface RoleSummary extends BaseEntity {
  readonly code: RoleCode;
  readonly label: string;
  readonly permissions: string[];
}

export interface PondSummary extends NamedEntity {
  readonly code: string;
  readonly farmId: EntityId;
  readonly kind: "pond" | "tank" | "cage";
  readonly status: "active" | "maintenance" | "inactive";
  readonly areaSqm?: number;
}

export interface BatchSummary extends NamedEntity {
  readonly pondId: EntityId;
  readonly species: string;
  readonly stockCount: number;
  readonly lifecycleStage: "planned" | "stocked" | "growing" | "harvested";
  readonly stockedAt?: ISODateString;
}

export interface WaterQualityReading extends BaseEntity {
  readonly pondId: EntityId;
  readonly recordedAt: ISODateString;
  readonly temperatureC?: number;
  readonly ph?: number;
  readonly dissolvedOxygenMgL?: number;
  readonly ammoniaMgL?: number;
  readonly notes?: string;
}

export interface FeedEntry extends BaseEntity {
  readonly pondId: EntityId;
  readonly batchId?: EntityId;
  readonly feedType: string;
  readonly quantityKg: number;
  readonly fedAt: ISODateString;
  readonly notes?: string;
}

export interface InventoryItem extends NamedEntity {
  readonly sku: string;
  readonly unit: string;
  readonly quantityOnHand: number;
  readonly reorderLevel?: number;
}

export interface InventoryTransaction extends BaseEntity {
  readonly itemId: EntityId;
  readonly kind: "in" | "out" | "adjustment";
  readonly quantity: number;
  readonly recordedAt: ISODateString;
  readonly notes?: string;
}

export interface MortalityEntry extends BaseEntity {
  readonly pondId: EntityId;
  readonly batchId?: EntityId;
  readonly count: number;
  readonly recordedAt: ISODateString;
  readonly suspectedCause?: string;
}

export interface TreatmentEntry extends BaseEntity {
  readonly pondId: EntityId;
  readonly batchId?: EntityId;
  readonly treatmentName: string;
  readonly dosage?: string;
  readonly administeredAt: ISODateString;
  readonly notes?: string;
}

export interface ExpenseEntry extends BaseEntity {
  readonly category: string;
  readonly amount: number;
  readonly currency: string;
  readonly incurredAt: ISODateString;
  readonly notes?: string;
}

export interface TaskSummary extends BaseEntity {
  readonly title: string;
  readonly description?: string;
  readonly status: TaskStatus;
  readonly dueAt?: ISODateString;
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

export interface ApprovalItem extends BaseEntity {
  readonly resourceType: string;
  readonly resourceId: EntityId;
  readonly status: ApprovalStatus;
  readonly requestedBy: EntityId;
  readonly requestedAt: ISODateString;
}

export interface AttachmentMetadata extends BaseEntity {
  readonly resourceType: string;
  readonly resourceId: EntityId;
  readonly fileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
}

export interface AuditEvent extends BaseEntity {
  readonly actorId?: EntityId;
  readonly action: AuditAction;
  readonly resourceType: string;
  readonly resourceId?: EntityId;
  readonly summary: string;
}

export interface AiRequestRecord extends BaseEntity {
  readonly kind: AiRequestKind;
  readonly inputText?: string;
  readonly targetResourceType?: string;
  readonly targetResourceId?: EntityId;
  readonly requestedBy?: EntityId;
}

export interface AiResponseRecord extends BaseEntity {
  readonly requestId: EntityId;
  readonly status: AiResponseStatus;
  readonly outputText: string;
  readonly model: string;
}

export interface AiFeedbackRecord extends BaseEntity {
  readonly responseId: EntityId;
  readonly rating: "up" | "down";
  readonly notes?: string;
}

export interface AiPromptTemplate extends BaseEntity {
  readonly key: string;
  readonly label: string;
  readonly version: string;
  readonly isActive: boolean;
}

export interface AiActionDraft extends BaseEntity {
  readonly requestId: EntityId;
  readonly actionType: string;
  readonly summary: string;
  readonly status: "draft" | "reviewed" | "discarded";
}

export interface PaginationParams {
  readonly page: number;
  readonly pageSize: number;
}

export interface PageMeta extends PaginationParams {
  readonly totalItems: number;
  readonly totalPages: number;
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
  readonly operator?: "eq" | "neq" | "contains" | "gte" | "lte" | "in";
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
