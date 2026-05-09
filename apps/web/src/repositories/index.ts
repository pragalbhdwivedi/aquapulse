import type {
  AlertAssignActionRequest,
  AlertBulkActionResult,
  AlertBulkAssignActionRequest,
  AlertBulkLifecycleActionRequest,
  AlertBulkReviewStateActionRequest,
  AlertExplanationAttachmentRequest,
  AlertExplanationFeedbackRecord,
  AlertExplanationFeedbackRequest,
  AlertLifecycleActionRequest,
  AlertQueueSummary,
  AlertReviewStateActionRequest,
  AlertSavedViewCreateRequest,
  AlertSavedViewDefinition,
  AiAlertsExplainRequest,
  AiAlertsExplainResponse,
  AiApprovalNoteDraftRequest,
  AiApprovalNoteDraftResponse,
  AiDashboardQueryRequest,
  AiDashboardQueryResponse,
  AiHandoverGenerateRequest,
  AiHandoverGenerateResponse,
  AiIncidentsDraftRequest,
  AiIncidentsDraftResponse,
  AiResponseRecord,
  AiPondsSummarizeRequest,
  AiPondsSummarizeResponse,
  AiTextRewriteRequest,
  AiTextRewriteResponse,
  AlertSummary,
  AlertUnassignActionRequest,
  ApiSuccessEnvelope,
  AuditEvent,
  BatchSummary,
  FeedCreateRequest,
  FeedEntry,
  FeedUpdateRequest,
  ListResponse,
  PondCreateRequest,
  PondUpdateRequest,
  PondSummary,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskSummary,
  WaterQualityCreateRequest,
  WaterQualityUpdateRequest,
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
  AiListQuery,
  AlertsListQuery,
  AuditListQuery,
  BatchesListQuery,
  FeedListQuery,
  PondsListQuery,
  TasksListQuery,
  WaterQualityListQuery
} from "../contracts/api";

export interface PondsRepository {
  create(input: PondCreateRequest): Promise<ApiSuccessEnvelope<PondSummary>>;
  list(query?: PondsListQuery): Promise<ApiSuccessEnvelope<ListResponse<PondSummary>>>;
  getById(id: string): Promise<ApiSuccessEnvelope<PondSummary>>;
  update(id: string, input: PondUpdateRequest): Promise<ApiSuccessEnvelope<PondSummary>>;
  summarize(input: AiPondsSummarizeRequest): Promise<ApiSuccessEnvelope<AiPondsSummarizeResponse>>;
}

export interface BatchesRepository {
  list(query?: BatchesListQuery): Promise<ApiSuccessEnvelope<ListResponse<BatchSummary>>>;
}

export interface WaterQualityRepository {
  create(input: WaterQualityCreateRequest): Promise<ApiSuccessEnvelope<WaterQualityReading>>;
  update(id: string, input: WaterQualityUpdateRequest): Promise<ApiSuccessEnvelope<WaterQualityReading>>;
  list(query: WaterQualityListQuery): Promise<ApiSuccessEnvelope<ListResponse<WaterQualityReading>>>;
  getById(id: string): Promise<ApiSuccessEnvelope<WaterQualityReading>>;
  listByPond(
    pondId: string,
    query?: Omit<WaterQualityListQuery, "pondId">
  ): Promise<ApiSuccessEnvelope<ListResponse<WaterQualityReading>>>;
}

export interface AlertsRepository {
  list(query?: AlertsListQuery): Promise<ApiSuccessEnvelope<ListResponse<AlertSummary>>>;
  summary(query?: AlertsListQuery): Promise<ApiSuccessEnvelope<AlertQueueSummary>>;
  getById(id: string): Promise<ApiSuccessEnvelope<AlertSummary>>;
  listSavedViews(): Promise<ApiSuccessEnvelope<AlertSavedViewDefinition[]>>;
  saveSavedView(input: AlertSavedViewCreateRequest): Promise<ApiSuccessEnvelope<AlertSavedViewDefinition[]>>;
  removeSavedView(id: string): Promise<ApiSuccessEnvelope<AlertSavedViewDefinition[]>>;
  acknowledge(id: string, input: AlertLifecycleActionRequest): Promise<ApiSuccessEnvelope<AlertSummary>>;
  bulkAcknowledge(input: AlertBulkLifecycleActionRequest): Promise<ApiSuccessEnvelope<AlertBulkActionResult>>;
  resolve(id: string, input: AlertLifecycleActionRequest): Promise<ApiSuccessEnvelope<AlertSummary>>;
  bulkResolve(input: AlertBulkLifecycleActionRequest): Promise<ApiSuccessEnvelope<AlertBulkActionResult>>;
  assign(id: string, input: AlertAssignActionRequest): Promise<ApiSuccessEnvelope<AlertSummary>>;
  bulkAssign(input: AlertBulkAssignActionRequest): Promise<ApiSuccessEnvelope<AlertBulkActionResult>>;
  unassign(id: string, input: AlertUnassignActionRequest): Promise<ApiSuccessEnvelope<AlertSummary>>;
  setReviewState(id: string, input: AlertReviewStateActionRequest): Promise<ApiSuccessEnvelope<AlertSummary>>;
  bulkSetReviewState(input: AlertBulkReviewStateActionRequest): Promise<ApiSuccessEnvelope<AlertBulkActionResult>>;
  explain(input: AiAlertsExplainRequest): Promise<ApiSuccessEnvelope<AiAlertsExplainResponse>>;
  attachExplanation(id: string, input: AlertExplanationAttachmentRequest): Promise<ApiSuccessEnvelope<AlertSummary>>;
  submitExplanationFeedback(
    input: AlertExplanationFeedbackRequest
  ): Promise<ApiSuccessEnvelope<AlertExplanationFeedbackRecord>>;
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
  update(id: string, input: FeedUpdateRequest): Promise<ApiSuccessEnvelope<FeedEntry>>;
  getById(id: string): Promise<ApiSuccessEnvelope<FeedEntry>>;
  list(query?: FeedListQuery): Promise<ApiSuccessEnvelope<ListResponse<FeedEntry>>>;
}

export interface AiRepository {
  list(query?: AiListQuery): Promise<ApiSuccessEnvelope<ListResponse<AiResponseRecord>>>;
  getById(id: string): Promise<ApiSuccessEnvelope<AiResponseRecord>>;
  rewriteText(input: AiTextRewriteRequest): Promise<ApiSuccessEnvelope<AiTextRewriteResponse>>;
  queryDashboard(input: AiDashboardQueryRequest): Promise<ApiSuccessEnvelope<AiDashboardQueryResponse>>;
  generateHandover(input: AiHandoverGenerateRequest): Promise<ApiSuccessEnvelope<AiHandoverGenerateResponse>>;
  draftIncident(input: AiIncidentsDraftRequest): Promise<ApiSuccessEnvelope<AiIncidentsDraftResponse>>;
  draftApprovalNote(input: AiApprovalNoteDraftRequest): Promise<ApiSuccessEnvelope<AiApprovalNoteDraftResponse>>;
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
      create(input: PondCreateRequest) {
        return clients.ponds.create(input);
      },
      list(query?: PondsListQuery) {
        return clients.ponds.list(query);
      },
      getById(id: string) {
        return clients.ponds.getById(id);
      },
      update(id: string, input: PondUpdateRequest) {
        return clients.ponds.update(id, input);
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
      update(id: string, input: WaterQualityUpdateRequest) {
        return clients.waterQuality.update(id, input);
      },
      list(query: WaterQualityListQuery) {
        return clients.waterQuality.list(query);
      },
      getById(id: string) {
        return clients.waterQuality.getById(id);
      },
      listByPond(pondId: string, query?: Omit<WaterQualityListQuery, "pondId">) {
        return clients.waterQuality.list({ page: 1, pageSize: 20, ...query, pondId });
      }
    },
    alerts: {
      list(query?: AlertsListQuery) {
        return clients.alerts.list(query);
      },
      summary(query?: AlertsListQuery) {
        return clients.alerts.summary(query);
      },
      getById(id: string) {
        return clients.alerts.getById(id);
      },
      listSavedViews() {
        return clients.alerts.listSavedViews();
      },
      saveSavedView(input: AlertSavedViewCreateRequest) {
        return clients.alerts.saveSavedView(input);
      },
      removeSavedView(id: string) {
        return clients.alerts.removeSavedView(id);
      },
      acknowledge(id: string, input: AlertLifecycleActionRequest) {
        return clients.alerts.acknowledge(id, input);
      },
      bulkAcknowledge(input: AlertBulkLifecycleActionRequest) {
        return clients.alerts.bulkAcknowledge(input);
      },
      resolve(id: string, input: AlertLifecycleActionRequest) {
        return clients.alerts.resolve(id, input);
      },
      bulkResolve(input: AlertBulkLifecycleActionRequest) {
        return clients.alerts.bulkResolve(input);
      },
      assign(id: string, input: AlertAssignActionRequest) {
        return clients.alerts.assign(id, input);
      },
      bulkAssign(input: AlertBulkAssignActionRequest) {
        return clients.alerts.bulkAssign(input);
      },
      unassign(id: string, input: AlertUnassignActionRequest) {
        return clients.alerts.unassign(id, input);
      },
      setReviewState(id: string, input: AlertReviewStateActionRequest) {
        return clients.alerts.setReviewState(id, input);
      },
      bulkSetReviewState(input: AlertBulkReviewStateActionRequest) {
        return clients.alerts.bulkSetReviewState(input);
      },
      explain(input: AiAlertsExplainRequest) {
        return clients.alerts.explain(input);
      },
      attachExplanation(id: string, input: AlertExplanationAttachmentRequest) {
        return clients.alerts.attachExplanation(id, input);
      },
      submitExplanationFeedback(input: AlertExplanationFeedbackRequest) {
        return clients.alerts.submitExplanationFeedback(input);
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
      update(id: string, input: FeedUpdateRequest) {
        return clients.feed.update(id, input);
      },
      getById(id: string) {
        return clients.feed.getById(id);
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
      list(query) {
        return clients.ai.list(query);
      },
      getById(id: string) {
        return clients.ai.getById(id);
      },
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
      },
      draftApprovalNote(input: AiApprovalNoteDraftRequest) {
        return clients.ai.draftApprovalNote(input);
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
