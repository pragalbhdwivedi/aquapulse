import type {
  EndpointContract,
  EndpointRequest,
  EndpointResponse
} from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import type { AquaPulseApiClients } from "./index";
import { createHttpClientFactory } from "./http-client-factory";
import {
  createClientsFromEndpointHandlers,
  createEndpointHandlersFromClients
} from "./endpoint-runtime";
import {
  endpointInvocationRegistry,
  flattenEndpointInvocationRegistry
} from "./invocation-registry";
import { createPlaceholderHttpTransportRegistry } from "./http-transport-registry";
import type { FetchExecutor } from "./fetch-executor";
import type { AquaPulseClientRuntimeConfig } from "./runtime-config";

type EndpointHandlers = ReturnType<typeof createEndpointHandlersFromClients>;

export function createFetchPlaceholderExecutor(handlers: EndpointHandlers) {
  return createPlaceholderHttpTransportRegistry(handlers, endpointInvocationRegistry).execute;
}

function createFetchDelegatedHandler<TEndpoint extends EndpointContract<unknown, unknown>>(
  endpoint: TEndpoint,
  execute: ReturnType<typeof createFetchPlaceholderExecutor>
) {
  const flattenedRegistry = flattenEndpointInvocationRegistry(endpointInvocationRegistry) as Record<
    string,
    {
      adaptRequest: (request: unknown) => unknown;
      adaptResponse: (response: unknown) => unknown;
    }
  >;

  return async (request: EndpointRequest<TEndpoint>): Promise<EndpointResponse<TEndpoint>> => {
    const invocation = flattenedRegistry[endpoint.id];
    if (!invocation) {
      throw new Error(`Missing invocation config for endpoint ${endpoint.id}`);
    }

    const httpRequest = invocation.adaptRequest(request) as Parameters<typeof execute>[0];
    const httpResponse = await execute(httpRequest);
    return invocation.adaptResponse(httpResponse) as EndpointResponse<TEndpoint>;
  };
}

export function createHttpPlaceholderEndpointHandlers(clients: AquaPulseApiClients) {
  const handlers = createEndpointHandlersFromClients(clients);
  const execute = createFetchPlaceholderExecutor(handlers);

  return {
    ponds: {
      create: createFetchDelegatedHandler(aquaPulseEndpointCatalog.ponds.create, execute),
      list: createFetchDelegatedHandler(aquaPulseEndpointCatalog.ponds.list, execute),
      getById: createFetchDelegatedHandler(aquaPulseEndpointCatalog.ponds.getById, execute),
      update: createFetchDelegatedHandler(aquaPulseEndpointCatalog.ponds.update, execute),
      summarize: createFetchDelegatedHandler(aquaPulseEndpointCatalog.ponds.summarize, execute)
    },
    alerts: {
      create: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.create, execute),
      list: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.list, execute),
      summary: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.summary, execute),
      getById: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.getById, execute),
      update: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.update, execute),
      acknowledge: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.acknowledge, execute),
      bulkAcknowledge: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.bulkAcknowledge, execute),
      resolve: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.resolve, execute),
      bulkResolve: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.bulkResolve, execute),
      assign: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.assign, execute),
      bulkAssign: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.bulkAssign, execute),
      unassign: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.unassign, execute),
      setReviewState: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.setReviewState, execute),
      bulkSetReviewState: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.bulkSetReviewState, execute),
      explain: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.explain, execute)
    },
    tasks: {
      create: createFetchDelegatedHandler(aquaPulseEndpointCatalog.tasks.create, execute),
      list: createFetchDelegatedHandler(aquaPulseEndpointCatalog.tasks.list, execute),
      getById: createFetchDelegatedHandler(aquaPulseEndpointCatalog.tasks.getById, execute),
      update: createFetchDelegatedHandler(aquaPulseEndpointCatalog.tasks.update, execute)
    },
    attachments: {
      create: createFetchDelegatedHandler(aquaPulseEndpointCatalog.attachments.create, execute),
      list: createFetchDelegatedHandler(aquaPulseEndpointCatalog.attachments.list, execute),
      getById: createFetchDelegatedHandler(aquaPulseEndpointCatalog.attachments.getById, execute),
      update: createFetchDelegatedHandler(aquaPulseEndpointCatalog.attachments.update, execute)
    },
    batches: {
      create: createFetchDelegatedHandler(aquaPulseEndpointCatalog.batches.create, execute),
      list: createFetchDelegatedHandler(aquaPulseEndpointCatalog.batches.list, execute),
      getById: createFetchDelegatedHandler(aquaPulseEndpointCatalog.batches.getById, execute),
      update: createFetchDelegatedHandler(aquaPulseEndpointCatalog.batches.update, execute)
    },
    feed: {
      create: createFetchDelegatedHandler(aquaPulseEndpointCatalog.feed.create, execute),
      list: createFetchDelegatedHandler(aquaPulseEndpointCatalog.feed.list, execute),
      getById: createFetchDelegatedHandler(aquaPulseEndpointCatalog.feed.getById, execute),
      update: createFetchDelegatedHandler(aquaPulseEndpointCatalog.feed.update, execute)
    },
    audit: {
      create: createFetchDelegatedHandler(aquaPulseEndpointCatalog.audit.create, execute),
      list: createFetchDelegatedHandler(aquaPulseEndpointCatalog.audit.list, execute),
      getById: createFetchDelegatedHandler(aquaPulseEndpointCatalog.audit.getById, execute),
      update: createFetchDelegatedHandler(aquaPulseEndpointCatalog.audit.update, execute)
    },
    waterQuality: {
      create: createFetchDelegatedHandler(aquaPulseEndpointCatalog.waterQuality.create, execute),
      list: createFetchDelegatedHandler(aquaPulseEndpointCatalog.waterQuality.list, execute),
      getById: createFetchDelegatedHandler(aquaPulseEndpointCatalog.waterQuality.getById, execute),
      update: createFetchDelegatedHandler(aquaPulseEndpointCatalog.waterQuality.update, execute)
    },
    ai: {
      create: createFetchDelegatedHandler(aquaPulseEndpointCatalog.ai.create, execute),
      list: createFetchDelegatedHandler(aquaPulseEndpointCatalog.ai.list, execute),
      getById: createFetchDelegatedHandler(aquaPulseEndpointCatalog.ai.getById, execute),
      update: createFetchDelegatedHandler(aquaPulseEndpointCatalog.ai.update, execute),
      explainAlert: createFetchDelegatedHandler(aquaPulseEndpointCatalog.ai.explainAlert, execute),
      summarizePond: createFetchDelegatedHandler(aquaPulseEndpointCatalog.ai.summarizePond, execute),
      generateHandover: createFetchDelegatedHandler(aquaPulseEndpointCatalog.ai.generateHandover, execute),
      rewriteText: createFetchDelegatedHandler(aquaPulseEndpointCatalog.ai.rewriteText, execute),
      queryDashboard: createFetchDelegatedHandler(aquaPulseEndpointCatalog.ai.queryDashboard, execute),
      draftIncident: createFetchDelegatedHandler(aquaPulseEndpointCatalog.ai.draftIncident, execute)
    }
  };
}

export function createHttpPlaceholderClients(
  clients: AquaPulseApiClients,
  config: AquaPulseClientRuntimeConfig = {
    mode: "http",
    enablePlaceholderHttp: true
  },
  executor: FetchExecutor = createFetchPlaceholderExecutor(createEndpointHandlersFromClients(clients))
): AquaPulseApiClients {
  return createHttpClientFactory({
    config,
    baseClients: {
      ...clients,
      ...createClientsFromEndpointHandlers(createHttpPlaceholderEndpointHandlers(clients))
    },
    executor,
    registry: endpointInvocationRegistry
  });
}
