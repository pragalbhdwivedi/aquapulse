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
  FeedCreateRequest,
  FeedEntry,
  ListResponse,
  PondSummary,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskSummary,
  WaterQualityCreateRequest,
  WaterQualityReading
} from "@aquapulse/types";
import type {
  AquaPulseApiClients
} from "../clients";
import {
  apiClients,
  createApiClientsFromConfig,
  createApiClientsFromEnv
} from "../clients";
import type {
  AquaPulseClientRuntimeConfig,
  AquaPulseClientRuntimeEnv
} from "../clients/runtime-config";
import type {
  AlertsListQuery,
  AuditListQuery,
  BatchesListQuery,
  FeedListQuery,
  PondsListQuery,
  TasksListQuery,
  WaterQualityListQuery
} from "../contracts/api";

export interface PondsRepository {
  list(query?: PondsListQuery): Promise<ApiSuccessEnvelope<ListResponse<PondSummary>>>;
  getById(id: string): Promise<ApiSuccessEnvelope<PondSummary>>;
  summarize(input: AiPondsSummarizeRequest): Promise<ApiSuccessEnvelope<AiPondsSummarizeResponse>>;
}

export interface BatchesRepository {
  list(query?: BatchesListQuery): Promise<ApiSuccessEnvelope<ListResponse<BatchSummary>>>;
}

export interface WaterQualityRepository {
  create(input: WaterQualityCreateRequest): Promise<ApiSuccessEnvelope<WaterQualityReading>>;
  list(query: WaterQualityListQuery): Promise<ApiSuccessEnvelope<ListResponse<WaterQualityReading>>>;
  listByPond(
    pondId: string,
    query?: Omit<WaterQualityListQuery, "pondId">
  ): Promise<ApiSuccessEnvelope<ListResponse<WaterQualityReading>>>;
}

export interface AlertsRepository {
  list(query?: AlertsListQuery): Promise<ApiSuccessEnvelope<ListResponse<AlertSummary>>>;
  explain(input: AiAlertsExplainRequest): Promise<ApiSuccessEnvelope<AiAlertsExplainResponse>>;
}

export interface TasksRepository {
  create(input: TaskCreateRequest): Promise<ApiSuccessEnvelope<TaskSummary>>;
  update(id: string, input: TaskUpdateRequest): Promise<ApiSuccessEnvelope<TaskSummary>>;
  getById(id: string): Promise<ApiSuccessEnvelope<TaskSummary>>;
  list(query?: TasksListQuery): Promise<ApiSuccessEnvelope<ListResponse<TaskSummary>>>;
}

export interface AuditRepository {
  list(query?: AuditListQuery): Promise<ApiSuccessEnvelope<ListResponse<AuditEvent>>>;
}

export interface FeedRepository {
  create(input: FeedCreateRequest): Promise<ApiSuccessEnvelope<FeedEntry>>;
  list(query?: FeedListQuery): Promise<ApiSuccessEnvelope<ListResponse<FeedEntry>>>;
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
  feed: FeedRepository;
  audit: AuditRepository;
  ai: AiRepository;
}

export function createRepositories(clients: AquaPulseApiClients): AquaPulseRepositories {
  return {
    ponds: {
      list(query?: PondsListQuery) {
        return clients.ponds.list(query);
      },
      getById(id: string) {
        return clients.ponds.getById(id);
      },
      summarize(input: AiPondsSummarizeRequest) {
        return clients.ponds.summarize(input);
      }
    },
    batches: {
      list(query?: BatchesListQuery) {
        return clients.batches.list(query);
      }
    },
    waterQuality: {
      create(input: WaterQualityCreateRequest) {
        return clients.waterQuality.create(input);
      },
      list(query: WaterQualityListQuery) {
        return clients.waterQuality.list(query);
      },
      listByPond(pondId: string, query?: Omit<WaterQualityListQuery, "pondId">) {
        return clients.waterQuality.list({ page: 1, pageSize: 20, ...query, pondId });
      }
    },
    alerts: {
      list(query?: AlertsListQuery) {
        return clients.alerts.list(query);
      },
      explain(input: AiAlertsExplainRequest) {
        return clients.alerts.explain(input);
      }
    },
    tasks: {
      create(input: TaskCreateRequest) {
        return clients.tasks.create(input);
      },
      update(id: string, input: TaskUpdateRequest) {
        return clients.tasks.update(id, input);
      },
      getById(id: string) {
        return clients.tasks.getById(id);
      },
      list(query?: TasksListQuery) {
        return clients.tasks.list(query);
      }
    },
    feed: {
      create(input: FeedCreateRequest) {
        return clients.feed.create(input);
      },
      list(query?: FeedListQuery) {
        return clients.feed.list(query);
      }
    },
    audit: {
      list(query?: AuditListQuery) {
        return clients.audit.list(query);
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

export function createRepositoriesFromConfig(
  config: AquaPulseClientRuntimeConfig
): AquaPulseRepositories {
  return createRepositories(createApiClientsFromConfig(config));
}

export function createRepositoriesFromEnv(
  env: AquaPulseClientRuntimeEnv = {}
): AquaPulseRepositories {
  return createRepositories(createApiClientsFromEnv(env));
}

export const repositories = createRepositories(apiClients);
export const pondsRepository = repositories.ponds;
export const batchesRepository = repositories.batches;
export const waterQualityRepository = repositories.waterQuality;
export const alertsRepository = repositories.alerts;
export const tasksRepository = repositories.tasks;
export const feedRepository = repositories.feed;
export const auditRepository = repositories.audit;
export const aiRepository = repositories.ai;
