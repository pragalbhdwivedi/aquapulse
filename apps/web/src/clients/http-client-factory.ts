import type {
  AlertLifecycleActionRequest,
  AlertSummary,
  ApiSuccessEnvelope,
  EndpointContract,
  FeedCreateRequest,
  FeedEntry,
  FeedUpdateRequest,
  ListResponse,
  PondSummary,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskSummary,
  WaterQualityCreateRequest,
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
    ponds: {
      ...baseClients.ponds,
      list(query) {
        return invokeListEndpoint<PondSummary, NonNullable<typeof query> | { page: number; pageSize: number }>(
          executor,
          registry.ponds.list,
          query ?? { page: 1, pageSize: 20 }
        );
      },
      getById(id) {
        return invokeItemEndpoint<PondSummary>(executor, registry.ponds.getById, { id });
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
      getById(id) {
        return invokeItemEndpoint<AlertSummary>(executor, registry.alerts.getById, { id });
      },
      acknowledge(id: string, input: AlertLifecycleActionRequest) {
        return invokeCreateEndpoint<AlertSummary, { readonly id: string; readonly body: AlertLifecycleActionRequest }>(
          executor,
          registry.alerts.acknowledge,
          { id, body: input }
        );
      },
      resolve(id: string, input: AlertLifecycleActionRequest) {
        return invokeCreateEndpoint<AlertSummary, { readonly id: string; readonly body: AlertLifecycleActionRequest }>(
          executor,
          registry.alerts.resolve,
          { id, body: input }
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
