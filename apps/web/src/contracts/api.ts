import type {
  AlertAssignActionRequest,
  AlertBulkActionResult,
  AlertBulkAssignActionRequest,
  AlertBulkLifecycleActionRequest,
  AlertBulkReviewStateActionRequest,
  AlertExplanationAttachmentRequest,
  AlertLifecycleActionRequest,
  AlertQueueSummary,
  AlertReviewStateActionRequest,
  AlertSavedViewCreateRequest,
  AlertSavedViewDefinition,
  AlertUnassignActionRequest,
  AiResponseRecord,
  AiAlertsExplainRequest,
  AiAlertsExplainResponse,
  AiResponseLogListQueryRequest,
  AiDashboardQueryRequest,
  AiDashboardQueryResponse,
  AiHandoverGenerateRequest,
  AiHandoverGenerateResponse,
  AiIncidentsDraftRequest,
  AiIncidentsDraftResponse,
  AiPondsSummarizeRequest,
  AiPondsSummarizeResponse,
  AiTextRewriteRequest,
  AiTextRewriteResponse,
  AlertSummary,
  AlertsListQueryRequest,
  AttachmentMetadata,
  ApiSuccessEnvelope,
  AttachmentsListQueryRequest,
  AuditListQueryRequest,
  BatchesListQueryRequest,
  FeedListQueryRequest,
  AuditEvent,
  BatchSummary,
  FeedCreateRequest,
  FeedEntry,
  FeedUpdateRequest,
  ListResponse,
  PondsListQueryRequest,
  PondSummary,
  TaskCreateRequest,
  TaskUpdateRequest,
  TasksListQueryRequest,
  TaskSummary,
  WaterQualityCreateRequest,
  WaterQualityListQueryRequest,
  WaterQualityReading
} from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import type { ListQueryRequest } from "@aquapulse/types";

export type ApiContract<TData> = Promise<ApiSuccessEnvelope<TData>>;
export type ApiItemContract<TItem> = ApiContract<TItem>;
export type ApiListContract<TItem> = ApiContract<ListResponse<TItem>>;

export function normalizeListQuery<TQuery extends Partial<ListQueryRequest>>(
  query?: TQuery
): ListQueryRequest & TQuery {
  return {
    page: query?.page ?? 1,
    pageSize: query?.pageSize ?? 20,
    ...(query ?? {})
  } as ListQueryRequest & TQuery;
}

export type PondsListQuery = PondsListQueryRequest;
export type AlertsListQuery = AlertsListQueryRequest;
export type TasksListQuery = TasksListQueryRequest;
export type AttachmentsListQuery = AttachmentsListQueryRequest;
export type AuditListQuery = AuditListQueryRequest;
export type BatchesListQuery = BatchesListQueryRequest;
export type FeedListQuery = FeedListQueryRequest;
export type WaterQualityListQuery = WaterQualityListQueryRequest;
export type AiListQuery = AiResponseLogListQueryRequest;

export const endpointCatalog = aquaPulseEndpointCatalog;

export interface PondsApiClient {
  list(query?: PondsListQuery): ApiListContract<PondSummary>;
  getById(id: string): ApiItemContract<PondSummary>;
  summarize(input: AiPondsSummarizeRequest): ApiItemContract<AiPondsSummarizeResponse>;
}

export interface BatchesApiClient {
  list(query?: BatchesListQuery): ApiListContract<BatchSummary>;
  getById(id: string): ApiItemContract<BatchSummary>;
}

export interface WaterQualityApiClient {
  create(input: WaterQualityCreateRequest): ApiItemContract<WaterQualityReading>;
  list(query: WaterQualityListQuery): ApiListContract<WaterQualityReading>;
  getById(id: string): ApiItemContract<WaterQualityReading>;
}

export interface AlertsApiClient {
  list(query?: AlertsListQuery): ApiListContract<AlertSummary>;
  summary(query?: AlertsListQuery): ApiItemContract<AlertQueueSummary>;
  getById(id: string): ApiItemContract<AlertSummary>;
  listSavedViews(): ApiItemContract<AlertSavedViewDefinition[]>;
  saveSavedView(input: AlertSavedViewCreateRequest): ApiItemContract<AlertSavedViewDefinition[]>;
  removeSavedView(id: string): ApiItemContract<AlertSavedViewDefinition[]>;
  acknowledge(id: string, input: AlertLifecycleActionRequest): ApiItemContract<AlertSummary>;
  bulkAcknowledge(input: AlertBulkLifecycleActionRequest): ApiItemContract<AlertBulkActionResult>;
  resolve(id: string, input: AlertLifecycleActionRequest): ApiItemContract<AlertSummary>;
  bulkResolve(input: AlertBulkLifecycleActionRequest): ApiItemContract<AlertBulkActionResult>;
  assign(id: string, input: AlertAssignActionRequest): ApiItemContract<AlertSummary>;
  bulkAssign(input: AlertBulkAssignActionRequest): ApiItemContract<AlertBulkActionResult>;
  unassign(id: string, input: AlertUnassignActionRequest): ApiItemContract<AlertSummary>;
  setReviewState(id: string, input: AlertReviewStateActionRequest): ApiItemContract<AlertSummary>;
  bulkSetReviewState(input: AlertBulkReviewStateActionRequest): ApiItemContract<AlertBulkActionResult>;
  explain(input: AiAlertsExplainRequest): ApiItemContract<AiAlertsExplainResponse>;
  attachExplanation(id: string, input: AlertExplanationAttachmentRequest): ApiItemContract<AlertSummary>;
}

export interface TasksApiClient {
  create(input: TaskCreateRequest): ApiItemContract<TaskSummary>;
  update(id: string, input: TaskUpdateRequest): ApiItemContract<TaskSummary>;
  list(query?: TasksListQuery): ApiListContract<TaskSummary>;
  getById(id: string): ApiItemContract<TaskSummary>;
}

export interface AttachmentsApiClient {
  list(query?: AttachmentsListQuery): ApiListContract<AttachmentMetadata>;
  getById(id: string): ApiItemContract<AttachmentMetadata>;
}

export interface FeedApiClient {
  create(input: FeedCreateRequest): ApiItemContract<FeedEntry>;
  update(id: string, input: FeedUpdateRequest): ApiItemContract<FeedEntry>;
  list(query?: FeedListQuery): ApiListContract<FeedEntry>;
  getById(id: string): ApiItemContract<FeedEntry>;
}

export interface AuditApiClient {
  list(query?: AuditListQuery): ApiListContract<AuditEvent>;
  getById(id: string): ApiItemContract<AuditEvent>;
}

export interface AiApiClient {
  list(query?: AiListQuery): ApiListContract<AiResponseRecord>;
  getById(id: string): ApiItemContract<AiResponseRecord>;
  rewriteText(input: AiTextRewriteRequest): ApiItemContract<AiTextRewriteResponse>;
  queryDashboard(input: AiDashboardQueryRequest): ApiItemContract<AiDashboardQueryResponse>;
  generateHandover(input: AiHandoverGenerateRequest): ApiItemContract<AiHandoverGenerateResponse>;
  draftIncident(input: AiIncidentsDraftRequest): ApiItemContract<AiIncidentsDraftResponse>;
}
