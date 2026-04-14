import type {
  AiAlertsExplainRequest,
  AiAlertsExplainResponse,
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
  ApiSuccessEnvelope,
  AuditEvent,
  BatchSummary,
  ListResponse,
  PondSummary,
  TaskSummary,
  WaterQualityReading
} from "@aquapulse/types";
import type { RepositoryListQuery } from "@aquapulse/database";

export type ApiContract<TData> = Promise<ApiSuccessEnvelope<TData>>;
export type ApiItemContract<TItem> = ApiContract<TItem>;
export type ApiListContract<TItem> = ApiContract<ListResponse<TItem>>;

export function normalizeListQuery<TQuery extends Partial<RepositoryListQuery>>(
  query?: TQuery
): RepositoryListQuery & TQuery {
  return {
    page: query?.page ?? 1,
    pageSize: query?.pageSize ?? 20,
    ...(query ?? {})
  } as RepositoryListQuery & TQuery;
}

export interface PondsListQuery extends RepositoryListQuery {
  readonly farmId?: string;
  readonly status?: "active" | "maintenance" | "inactive";
  readonly kind?: "pond" | "tank" | "cage";
}

export interface AlertsListQuery extends RepositoryListQuery {
  readonly pondId?: string;
  readonly severity?: AlertSummary["severity"];
  readonly status?: AlertSummary["status"];
  readonly source?: string;
}

export interface TasksListQuery extends RepositoryListQuery {
  readonly assigneeId?: string;
  readonly pondId?: string;
  readonly status?: TaskSummary["status"];
}

export interface AuditListQuery extends RepositoryListQuery {
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly action?: AuditEvent["action"];
}

export interface BatchesListQuery extends RepositoryListQuery {
  readonly pondId?: string;
  readonly lifecycleStage?: BatchSummary["lifecycleStage"];
}

export interface FeedListQuery extends RepositoryListQuery {
  readonly pondId?: string;
  readonly batchId?: string;
  readonly feedType?: string;
}

export interface WaterQualityListQuery extends RepositoryListQuery {
  readonly pondId?: string;
  readonly metric?: "temperatureC" | "ph";
}

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
