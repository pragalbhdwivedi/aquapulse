import type {
  AiAlertsExplainRequest,
  AiAlertsExplainResponse,
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
  AlertSummary,
  AlertUnassignActionRequest,
  ApiSuccessEnvelope,
  CurrentSessionPayload,
  EndpointContract,
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
import type { AquaPulseApiClients } from "./index";
import type { FetchExecutor } from "./fetch-executor";
import {
  normalizeItemResponse,
  normalizeListResponse
} from "./http-response-normalizers";
import {
  endpointInvocationRegistry,
  type EndpointInvocationConfig,
  type EndpointInvocationRegistry
} from "./invocation-registry";
import { buildHttpRequestFromInvocation } from "./http-request-builders";
import type { AquaPulseClientRuntimeConfig } from "./runtime-config";

export interface HttpClientFactoryOptions {
  readonly config: AquaPulseClientRuntimeConfig;
  readonly baseClients: AquaPulseApiClients;
  readonly executor?: FetchExecutor;
  readonly registry?: EndpointInvocationRegistry;
}

async function invokeListEndpoint<
  TItem,
  TQuery
>(
  executor: FetchExecutor,
  invocation: EndpointInvocationConfig<
    EndpointContract<TQuery, ApiSuccessEnvelope<ListResponse<TItem>>>
  >,
  query: TQuery
): Promise<ApiSuccessEnvelope<ListResponse<TItem>>> {
  const request = buildHttpRequestFromInvocation(invocation, query);
  const response = await executor<ApiSuccessEnvelope<ListResponse<TItem>>>(request);
  return normalizeListResponse(response);
}

async function invokeItemEndpoint<TItem>(
  executor: FetchExecutor,
  invocation: EndpointInvocationConfig<
    EndpointContract<{ readonly id: string }, ApiSuccessEnvelope<TItem>>
  >,
  requestInput: { readonly id: string }
): Promise<ApiSuccessEnvelope<TItem>> {
  const request = buildHttpRequestFromInvocation(invocation, requestInput);
  const response = await executor<ApiSuccessEnvelope<TItem>>(request);
  return normalizeItemResponse(response);
}

async function invokeCreateEndpoint<TItem, TInput>(
  executor: FetchExecutor,
  invocation: EndpointInvocationConfig<
    EndpointContract<TInput, ApiSuccessEnvelope<TItem>>
  >,
  input: TInput
): Promise<ApiSuccessEnvelope<TItem>> {
  const request = buildHttpRequestFromInvocation(invocation, input);
  const response = await executor<ApiSuccessEnvelope<TItem>>(request);
  return normalizeItemResponse(response);
}

export function createHttpClientFactory({
  config,
  baseClients,
  executor,
  registry = endpointInvocationRegistry
}: HttpClientFactoryOptions): AquaPulseApiClients {
  if (config.mode !== "http" || !executor) {
    return baseClients;
  }

  return {
    ...baseClients,
    auth: {
      ...baseClients.auth,
      getSession() {
        return invokeCreateEndpoint<CurrentSessionPayload, Record<string, never>>(
          executor,
          registry.auth.session,
          {}
        );
      }
    },
    ponds: {
      ...baseClients.ponds,
      create(input: PondCreateRequest) {
        return invokeCreateEndpoint<PondSummary, PondCreateRequest>(
          executor,
          registry.ponds.create,
          input
        );
      },
      list(query) {
        return invokeListEndpoint<PondSummary, NonNullable<typeof query> | { page: number; pageSize: number }>(
          executor,
          registry.ponds.list,
          query ?? { page: 1, pageSize: 20 }
        );
      },
      getById(id) {
        return invokeItemEndpoint<PondSummary>(executor, registry.ponds.getById, { id });
      },
      update(id: string, input: PondUpdateRequest) {
        return invokeCreateEndpoint<PondSummary, { readonly id: string; readonly body: PondUpdateRequest }>(
          executor,
          registry.ponds.update,
          { id, body: input }
        );
      }
    },
    waterQuality: {
      ...baseClients.waterQuality,
      create(input: WaterQualityCreateRequest) {
        return invokeCreateEndpoint<WaterQualityReading, WaterQualityCreateRequest>(
          executor,
          registry.waterQuality.create,
          input
        );
      },
      list(query) {
        return invokeListEndpoint<
          WaterQualityReading,
          NonNullable<typeof query> | { page: number; pageSize: number }
        >(executor, registry.waterQuality.list, query ?? { page: 1, pageSize: 20 });
      },
      getById(id: string) {
        return invokeItemEndpoint<WaterQualityReading>(
          executor,
          registry.waterQuality.getById,
          { id }
        );
      },
      update(id: string, input: WaterQualityUpdateRequest) {
        return invokeCreateEndpoint<
          WaterQualityReading,
          { readonly id: string; readonly body: WaterQualityUpdateRequest }
        >(executor, registry.waterQuality.update, { id, body: input });
      }
    },
    alerts: {
      ...baseClients.alerts,
      list(query) {
        return invokeListEndpoint<AlertSummary, NonNullable<typeof query> | { page: number; pageSize: number }>(
          executor,
          registry.alerts.list,
          query ?? { page: 1, pageSize: 20 }
        );
      },
      summary(query) {
        return invokeCreateEndpoint<AlertQueueSummary, NonNullable<typeof query> | { page: number; pageSize: number }>(
          executor,
          registry.alerts.summary,
          query ?? { page: 1, pageSize: 20 }
        );
      },
      getById(id) {
        return invokeItemEndpoint<AlertSummary>(executor, registry.alerts.getById, { id });
      },
      listSavedViews() {
        return invokeCreateEndpoint<AlertSavedViewDefinition[], Record<string, never>>(
          executor,
          registry.alerts.listSavedViews,
          {}
        );
      },
      saveSavedView(input: AlertSavedViewCreateRequest) {
        return invokeCreateEndpoint<AlertSavedViewDefinition[], AlertSavedViewCreateRequest>(
          executor,
          registry.alerts.saveSavedView,
          input
        );
      },
      removeSavedView(id: string) {
        return invokeCreateEndpoint<AlertSavedViewDefinition[], { readonly id: string }>(
          executor,
          registry.alerts.removeSavedView,
          { id }
        );
      },
      acknowledge(id: string, input: AlertLifecycleActionRequest) {
        return invokeCreateEndpoint<AlertSummary, { readonly id: string; readonly body: AlertLifecycleActionRequest }>(
          executor,
          registry.alerts.acknowledge,
          { id, body: input }
        );
      },
      bulkAcknowledge(input: AlertBulkLifecycleActionRequest) {
        return invokeCreateEndpoint<AlertBulkActionResult, AlertBulkLifecycleActionRequest>(
          executor,
          registry.alerts.bulkAcknowledge,
          input
        );
      },
      resolve(id: string, input: AlertLifecycleActionRequest) {
        return invokeCreateEndpoint<AlertSummary, { readonly id: string; readonly body: AlertLifecycleActionRequest }>(
          executor,
          registry.alerts.resolve,
          { id, body: input }
        );
      },
      bulkResolve(input: AlertBulkLifecycleActionRequest) {
        return invokeCreateEndpoint<AlertBulkActionResult, AlertBulkLifecycleActionRequest>(
          executor,
          registry.alerts.bulkResolve,
          input
        );
      },
      assign(id: string, input: AlertAssignActionRequest) {
        return invokeCreateEndpoint<AlertSummary, { readonly id: string; readonly body: AlertAssignActionRequest }>(
          executor,
          registry.alerts.assign,
          { id, body: input }
        );
      },
      bulkAssign(input: AlertBulkAssignActionRequest) {
        return invokeCreateEndpoint<AlertBulkActionResult, AlertBulkAssignActionRequest>(
          executor,
          registry.alerts.bulkAssign,
          input
        );
      },
      unassign(id: string, input: AlertUnassignActionRequest) {
        return invokeCreateEndpoint<AlertSummary, { readonly id: string; readonly body: AlertUnassignActionRequest }>(
          executor,
          registry.alerts.unassign,
          { id, body: input }
        );
      },
      setReviewState(id: string, input: AlertReviewStateActionRequest) {
        return invokeCreateEndpoint<
          AlertSummary,
          { readonly id: string; readonly body: AlertReviewStateActionRequest }
        >(executor, registry.alerts.setReviewState, { id, body: input });
      },
      bulkSetReviewState(input: AlertBulkReviewStateActionRequest) {
        return invokeCreateEndpoint<AlertBulkActionResult, AlertBulkReviewStateActionRequest>(
          executor,
          registry.alerts.bulkSetReviewState,
          input
        );
      },
      explain(input) {
        return invokeCreateEndpoint<AiAlertsExplainResponse, AiAlertsExplainRequest>(
          executor,
          registry.alerts.explain,
          input
        );
      },
      attachExplanation(id: string, input: AlertExplanationAttachmentRequest) {
        return invokeCreateEndpoint<
          AlertSummary,
          { readonly id: string; readonly body: AlertExplanationAttachmentRequest }
        >(executor, registry.alerts.attachExplanation, { id, body: input });
      },
      submitExplanationFeedback(input: AlertExplanationFeedbackRequest) {
        return invokeCreateEndpoint<AlertExplanationFeedbackRecord, AlertExplanationFeedbackRequest>(
          executor,
          registry.alerts.submitExplanationFeedback,
          input
        );
      }
    },
    feed: {
      ...baseClients.feed,
      create(input: FeedCreateRequest) {
        return invokeCreateEndpoint<FeedEntry, FeedCreateRequest>(
          executor,
          registry.feed.create,
          input
        );
      },
      list(query) {
        return invokeListEndpoint<FeedEntry, NonNullable<typeof query> | { page: number; pageSize: number }>(
          executor,
          registry.feed.list,
          query ?? { page: 1, pageSize: 20 }
        );
      },
      getById(id) {
        return invokeItemEndpoint<FeedEntry>(executor, registry.feed.getById, { id });
      },
      update(id: string, input: FeedUpdateRequest) {
        return invokeCreateEndpoint<FeedEntry, { readonly id: string; readonly body: FeedUpdateRequest }>(
          executor,
          registry.feed.update,
          { id, body: input }
        );
      }
    },
    tasks: {
      ...baseClients.tasks,
      create(input: TaskCreateRequest) {
        return invokeCreateEndpoint<TaskSummary, TaskCreateRequest>(
          executor,
          registry.tasks.create,
          input
        );
      },
      list(query) {
        return invokeListEndpoint<TaskSummary, NonNullable<typeof query> | { page: number; pageSize: number }>(
          executor,
          registry.tasks.list,
          query ?? { page: 1, pageSize: 20 }
        );
      },
      getById(id: string) {
        return invokeItemEndpoint<TaskSummary>(executor, registry.tasks.getById, { id });
      },
      update(id: string, input: TaskUpdateRequest) {
        return invokeCreateEndpoint<TaskSummary, { readonly id: string; readonly body: TaskUpdateRequest }>(
          executor,
          registry.tasks.update,
          { id, body: input }
        );
      }
    }
  };
}
