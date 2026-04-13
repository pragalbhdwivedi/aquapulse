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
import type { AquaPulseApiClients } from "../clients";
import { apiClients } from "../clients";

export interface PondsRepository {
  list(): Promise<ApiSuccessEnvelope<ListResponse<PondSummary>>>;
  getById(id: string): Promise<ApiSuccessEnvelope<PondSummary>>;
  summarize(input: AiPondsSummarizeRequest): Promise<ApiSuccessEnvelope<AiPondsSummarizeResponse>>;
}

export interface BatchesRepository {
  list(): Promise<ApiSuccessEnvelope<ListResponse<BatchSummary>>>;
}

export interface WaterQualityRepository {
  listByPond(pondId: string): Promise<ApiSuccessEnvelope<ListResponse<WaterQualityReading>>>;
}

export interface AlertsRepository {
  list(): Promise<ApiSuccessEnvelope<ListResponse<AlertSummary>>>;
  explain(input: AiAlertsExplainRequest): Promise<ApiSuccessEnvelope<AiAlertsExplainResponse>>;
}

export interface TasksRepository {
  list(): Promise<ApiSuccessEnvelope<ListResponse<TaskSummary>>>;
}

export interface AuditRepository {
  list(): Promise<ApiSuccessEnvelope<ListResponse<AuditEvent>>>;
}

export interface AiRepository {
  rewriteText(input: AiTextRewriteRequest): Promise<ApiSuccessEnvelope<AiTextRewriteResponse>>;
  queryDashboard(input: AiDashboardQueryRequest): Promise<ApiSuccessEnvelope<AiDashboardQueryResponse>>;
  generateHandover(input: AiHandoverGenerateRequest): Promise<ApiSuccessEnvelope<AiHandoverGenerateResponse>>;
  draftIncident(input: AiIncidentsDraftRequest): Promise<ApiSuccessEnvelope<AiIncidentsDraftResponse>>;
}

export interface AquaPulseRepositories {
  ponds: PondsRepository;
  batches: BatchesRepository;
  waterQuality: WaterQualityRepository;
  alerts: AlertsRepository;
  tasks: TasksRepository;
  audit: AuditRepository;
  ai: AiRepository;
}

export function createRepositories(clients: AquaPulseApiClients): AquaPulseRepositories {
  return {
    ponds: {
      list() {
        return clients.ponds.list();
      },
      getById(id: string) {
        return clients.ponds.getById(id);
      },
      summarize(input: AiPondsSummarizeRequest) {
        return clients.ponds.summarize(input);
      }
    },
    batches: {
      list() {
        return clients.batches.list();
      }
    },
    waterQuality: {
      listByPond(pondId: string) {
        return clients.waterQuality.listByPond(pondId);
      }
    },
    alerts: {
      list() {
        return clients.alerts.list();
      },
      explain(input: AiAlertsExplainRequest) {
        return clients.alerts.explain(input);
      }
    },
    tasks: {
      list() {
        return clients.tasks.list();
      }
    },
    audit: {
      list() {
        return clients.audit.list();
      }
    },
    ai: {
      rewriteText(input: AiTextRewriteRequest) {
        return clients.ai.rewriteText(input);
      },
      queryDashboard(input: AiDashboardQueryRequest) {
        return clients.ai.queryDashboard(input);
      },
      generateHandover(input: AiHandoverGenerateRequest) {
        return clients.ai.generateHandover(input);
      },
      draftIncident(input: AiIncidentsDraftRequest) {
        return clients.ai.draftIncident(input);
      }
    }
  };
}

export const repositories = createRepositories(apiClients);
export const pondsRepository = repositories.ponds;
export const batchesRepository = repositories.batches;
export const waterQualityRepository = repositories.waterQuality;
export const alertsRepository = repositories.alerts;
export const tasksRepository = repositories.tasks;
export const auditRepository = repositories.audit;
export const aiRepository = repositories.ai;
