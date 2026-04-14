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
  list(query?: PondsListQuery): ApiContract<ListResponse<PondSummary>>;
  getById(id: string): ApiContract<PondSummary>;
  summarize(input: AiPondsSummarizeRequest): ApiContract<AiPondsSummarizeResponse>;
}

export interface BatchesApiClient {
  list(query?: BatchesListQuery): ApiContract<ListResponse<BatchSummary>>;
}

export interface WaterQualityApiClient {
  list(query: WaterQualityListQuery): ApiContract<ListResponse<WaterQualityReading>>;
}

export interface AlertsApiClient {
  list(query?: AlertsListQuery): ApiContract<ListResponse<AlertSummary>>;
  explain(input: AiAlertsExplainRequest): ApiContract<AiAlertsExplainResponse>;
}

export interface TasksApiClient {
  list(query?: TasksListQuery): ApiContract<ListResponse<TaskSummary>>;
}

export interface AuditApiClient {
  list(query?: AuditListQuery): ApiContract<ListResponse<AuditEvent>>;
}

export interface AiApiClient {
  rewriteText(input: AiTextRewriteRequest): ApiContract<AiTextRewriteResponse>;
  queryDashboard(input: AiDashboardQueryRequest): ApiContract<AiDashboardQueryResponse>;
  generateHandover(input: AiHandoverGenerateRequest): ApiContract<AiHandoverGenerateResponse>;
  draftIncident(input: AiIncidentsDraftRequest): ApiContract<AiIncidentsDraftResponse>;
}
