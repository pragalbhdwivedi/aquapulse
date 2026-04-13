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

export type ApiContract<TData> = Promise<ApiSuccessEnvelope<TData>>;

export interface PondsApiClient {
  list(): ApiContract<ListResponse<PondSummary>>;
  getById(id: string): ApiContract<PondSummary>;
  summarize(input: AiPondsSummarizeRequest): ApiContract<AiPondsSummarizeResponse>;
}

export interface BatchesApiClient {
  list(): ApiContract<ListResponse<BatchSummary>>;
}

export interface WaterQualityApiClient {
  listByPond(pondId: string): ApiContract<ListResponse<WaterQualityReading>>;
}

export interface AlertsApiClient {
  list(): ApiContract<ListResponse<AlertSummary>>;
  explain(input: AiAlertsExplainRequest): ApiContract<AiAlertsExplainResponse>;
}

export interface TasksApiClient {
  list(): ApiContract<ListResponse<TaskSummary>>;
}

export interface AuditApiClient {
  list(): ApiContract<ListResponse<AuditEvent>>;
}

export interface AiApiClient {
  rewriteText(input: AiTextRewriteRequest): ApiContract<AiTextRewriteResponse>;
  queryDashboard(input: AiDashboardQueryRequest): ApiContract<AiDashboardQueryResponse>;
  generateHandover(input: AiHandoverGenerateRequest): ApiContract<AiHandoverGenerateResponse>;
  draftIncident(input: AiIncidentsDraftRequest): ApiContract<AiIncidentsDraftResponse>;
}
