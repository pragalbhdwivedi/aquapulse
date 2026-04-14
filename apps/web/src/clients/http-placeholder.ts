import type {
  EndpointContract,
  EndpointRequest,
  EndpointResponse
} from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import type { AquaPulseApiClients } from "./index";
import {
  createClientsFromEndpointHandlers,
  createEndpointHandlersFromClients
} from "./endpoint-runtime";
import {
  adaptEndpointRequestToHttp,
  adaptHttpResponseToEndpoint,
  createPlaceholderHttpResponse,
  type PlaceholderHttpRequest
} from "./http-adapters";

type EndpointHandlers = ReturnType<typeof createEndpointHandlersFromClients>;

function createEndpointHandlerRegistry(handlers: EndpointHandlers) {
  return {
    [aquaPulseEndpointCatalog.ponds.create.id]: handlers.ponds.create,
    [aquaPulseEndpointCatalog.ponds.list.id]: handlers.ponds.list,
    [aquaPulseEndpointCatalog.ponds.getById.id]: handlers.ponds.getById,
    [aquaPulseEndpointCatalog.ponds.update.id]: handlers.ponds.update,
    [aquaPulseEndpointCatalog.ponds.summarize.id]: handlers.ponds.summarize,
    [aquaPulseEndpointCatalog.alerts.create.id]: handlers.alerts.create,
    [aquaPulseEndpointCatalog.alerts.list.id]: handlers.alerts.list,
    [aquaPulseEndpointCatalog.alerts.getById.id]: handlers.alerts.getById,
    [aquaPulseEndpointCatalog.alerts.update.id]: handlers.alerts.update,
    [aquaPulseEndpointCatalog.alerts.explain.id]: handlers.alerts.explain,
    [aquaPulseEndpointCatalog.tasks.create.id]: handlers.tasks.create,
    [aquaPulseEndpointCatalog.tasks.list.id]: handlers.tasks.list,
    [aquaPulseEndpointCatalog.tasks.getById.id]: handlers.tasks.getById,
    [aquaPulseEndpointCatalog.tasks.update.id]: handlers.tasks.update,
    [aquaPulseEndpointCatalog.attachments.create.id]: handlers.attachments.create,
    [aquaPulseEndpointCatalog.attachments.list.id]: handlers.attachments.list,
    [aquaPulseEndpointCatalog.attachments.getById.id]: handlers.attachments.getById,
    [aquaPulseEndpointCatalog.attachments.update.id]: handlers.attachments.update,
    [aquaPulseEndpointCatalog.batches.create.id]: handlers.batches.create,
    [aquaPulseEndpointCatalog.batches.list.id]: handlers.batches.list,
    [aquaPulseEndpointCatalog.batches.getById.id]: handlers.batches.getById,
    [aquaPulseEndpointCatalog.batches.update.id]: handlers.batches.update,
    [aquaPulseEndpointCatalog.feed.create.id]: handlers.feed.create,
    [aquaPulseEndpointCatalog.feed.list.id]: handlers.feed.list,
    [aquaPulseEndpointCatalog.feed.getById.id]: handlers.feed.getById,
    [aquaPulseEndpointCatalog.feed.update.id]: handlers.feed.update,
    [aquaPulseEndpointCatalog.audit.create.id]: handlers.audit.create,
    [aquaPulseEndpointCatalog.audit.list.id]: handlers.audit.list,
    [aquaPulseEndpointCatalog.audit.getById.id]: handlers.audit.getById,
    [aquaPulseEndpointCatalog.audit.update.id]: handlers.audit.update,
    [aquaPulseEndpointCatalog.waterQuality.create.id]: handlers.waterQuality.create,
    [aquaPulseEndpointCatalog.waterQuality.list.id]: handlers.waterQuality.list,
    [aquaPulseEndpointCatalog.waterQuality.getById.id]: handlers.waterQuality.getById,
    [aquaPulseEndpointCatalog.waterQuality.update.id]: handlers.waterQuality.update,
    [aquaPulseEndpointCatalog.ai.create.id]: handlers.ai.create,
    [aquaPulseEndpointCatalog.ai.list.id]: handlers.ai.list,
    [aquaPulseEndpointCatalog.ai.getById.id]: handlers.ai.getById,
    [aquaPulseEndpointCatalog.ai.update.id]: handlers.ai.update,
    [aquaPulseEndpointCatalog.ai.explainAlert.id]: handlers.ai.explainAlert,
    [aquaPulseEndpointCatalog.ai.summarizePond.id]: handlers.ai.summarizePond,
    [aquaPulseEndpointCatalog.ai.generateHandover.id]: handlers.ai.generateHandover,
    [aquaPulseEndpointCatalog.ai.rewriteText.id]: handlers.ai.rewriteText,
    [aquaPulseEndpointCatalog.ai.queryDashboard.id]: handlers.ai.queryDashboard,
    [aquaPulseEndpointCatalog.ai.draftIncident.id]: handlers.ai.draftIncident
  } as const;
}

export function createFetchPlaceholderExecutor(handlers: EndpointHandlers) {
  const registry = createEndpointHandlerRegistry(handlers);

  return async function execute<TEndpoint extends EndpointContract<unknown, unknown>>(
    request: PlaceholderHttpRequest<TEndpoint>,
    input: EndpointRequest<TEndpoint>
  ) {
    const handler = registry[request.endpointId] as unknown as (
      input: EndpointRequest<TEndpoint>
    ) => Promise<EndpointResponse<TEndpoint>>;
    const response = await handler(input);
    return createPlaceholderHttpResponse(response);
  };
}

function createFetchDelegatedHandler<TEndpoint extends EndpointContract<unknown, unknown>>(
  endpoint: TEndpoint,
  execute: ReturnType<typeof createFetchPlaceholderExecutor>
) {
  return async (request: EndpointRequest<TEndpoint>): Promise<EndpointResponse<TEndpoint>> => {
    const httpRequest = adaptEndpointRequestToHttp(endpoint, request);
    const httpResponse = await execute(httpRequest, request);
    return adaptHttpResponseToEndpoint(endpoint, httpResponse);
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
      getById: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.getById, execute),
      update: createFetchDelegatedHandler(aquaPulseEndpointCatalog.alerts.update, execute),
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

export function createHttpPlaceholderClients(clients: AquaPulseApiClients): AquaPulseApiClients {
  return createClientsFromEndpointHandlers(createHttpPlaceholderEndpointHandlers(clients));
}
