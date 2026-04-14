import type {
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
  ApiSuccessEnvelope,
  AttachmentsListQueryRequest,
  AuditListQueryRequest,
  BatchesListQueryRequest,
  FeedListQueryRequest,
  AuditEvent,
  BatchSummary,
  ListResponse,
  PondsListQueryRequest,
  PondSummary,
  TasksListQueryRequest,
  TaskSummary,
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
}

export interface WaterQualityApiClient {
  list(query: WaterQualityListQuery): ApiListContract<WaterQualityReading>;
}

export interface AlertsApiClient {
  list(query?: AlertsListQuery): ApiListContract<AlertSummary>;
  explain(input: AiAlertsExplainRequest): ApiItemContract<AiAlertsExplainResponse>;
}

export interface TasksApiClient {
  list(query?: TasksListQuery): ApiListContract<TaskSummary>;
}

export interface AuditApiClient {
  list(query?: AuditListQuery): ApiListContract<AuditEvent>;
}

export interface AiApiClient {
  rewriteText(input: AiTextRewriteRequest): ApiItemContract<AiTextRewriteResponse>;
  queryDashboard(input: AiDashboardQueryRequest): ApiItemContract<AiDashboardQueryResponse>;
  generateHandover(input: AiHandoverGenerateRequest): ApiItemContract<AiHandoverGenerateResponse>;
  draftIncident(input: AiIncidentsDraftRequest): ApiItemContract<AiIncidentsDraftResponse>;
}
