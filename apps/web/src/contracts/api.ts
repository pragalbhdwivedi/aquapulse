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
  WaterQualityReading,
} from "@aquapulse/types";

export type ApiContract<TData> = Promise<ApiSuccessEnvelope<TData>>;

export interface PondsApiContract {
  list(): ApiContract<ListResponse<PondSummary>>;
  getById(pondId: string): ApiContract<PondSummary>;
  summarize(request: AiPondsSummarizeRequest): ApiContract<AiPondsSummarizeResponse>;
}

export interface BatchesApiContract {
  list(): ApiContract<ListResponse<BatchSummary>>;
}

export interface WaterQualityApiContract {
  listByPond(pondId: string): ApiContract<ListResponse<WaterQualityReading>>;
}

export interface AlertsApiContract {
  list(): ApiContract<ListResponse<AlertSummary>>;
  explain(request: AiAlertsExplainRequest): ApiContract<AiAlertsExplainResponse>;
}

export interface TasksApiContract {
  list(): ApiContract<ListResponse<TaskSummary>>;
}

export interface AuditApiContract {
  list(): ApiContract<ListResponse<AuditEvent>>;
}

export interface AiApiContract {
  rewriteText(request: AiTextRewriteRequest): ApiContract<AiTextRewriteResponse>;
  queryDashboard(request: AiDashboardQueryRequest): ApiContract<AiDashboardQueryResponse>;
  generateHandover(request: AiHandoverGenerateRequest): ApiContract<AiHandoverGenerateResponse>;
  draftIncident(request: AiIncidentsDraftRequest): ApiContract<AiIncidentsDraftResponse>;
}
