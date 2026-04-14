import type { EndpointContract, EndpointRequest, EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import {
  adaptEndpointRequestToHttp,
  adaptHttpResponseToEndpoint,
  type PlaceholderHttpRequest,
  type PlaceholderHttpResponse
} from "./http-adapters";

type AquaPulseEndpointCatalog = typeof aquaPulseEndpointCatalog;

export type EndpointTransportMode = "mock" | "placeholder_http";

export interface EndpointInvocationConfig<TEndpoint extends EndpointContract<unknown, unknown>> {
  readonly endpoint: TEndpoint;
  readonly endpointId: TEndpoint["id"];
  readonly method: TEndpoint["method"];
  readonly path: TEndpoint["path"];
  readonly semantics: TEndpoint["semantics"];
  readonly transport: {
    readonly mock: EndpointTransportMode;
    readonly http: EndpointTransportMode;
  };
  readonly adaptRequest: (request: EndpointRequest<TEndpoint>) => PlaceholderHttpRequest<TEndpoint>;
  readonly adaptResponse: (
    response: PlaceholderHttpResponse<EndpointResponse<TEndpoint>>
  ) => EndpointResponse<TEndpoint>;
}

export function defineEndpointInvocationConfig<TEndpoint extends EndpointContract<unknown, unknown>>(
  endpoint: TEndpoint
): EndpointInvocationConfig<TEndpoint> {
  return {
    endpoint,
    endpointId: endpoint.id,
    method: endpoint.method,
    path: endpoint.path,
    semantics: endpoint.semantics,
    transport: {
      mock: "mock",
      http: "placeholder_http"
    },
    adaptRequest: (request) => adaptEndpointRequestToHttp(endpoint, request),
    adaptResponse: (response) => adaptHttpResponseToEndpoint(endpoint, response)
  };
}

export const endpointInvocationRegistry = {
  ponds: {
    create: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.ponds.create),
    list: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.ponds.list),
    getById: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.ponds.getById),
    update: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.ponds.update),
    summarize: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.ponds.summarize)
  },
  alerts: {
    create: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.alerts.create),
    list: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.alerts.list),
    getById: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.alerts.getById),
    update: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.alerts.update),
    acknowledge: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.alerts.acknowledge),
    resolve: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.alerts.resolve),
    assign: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.alerts.assign),
    unassign: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.alerts.unassign),
    setReviewState: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.alerts.setReviewState),
    explain: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.alerts.explain)
  },
  tasks: {
    create: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.tasks.create),
    list: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.tasks.list),
    getById: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.tasks.getById),
    update: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.tasks.update)
  },
  attachments: {
    create: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.attachments.create),
    list: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.attachments.list),
    getById: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.attachments.getById),
    update: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.attachments.update)
  },
  batches: {
    create: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.batches.create),
    list: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.batches.list),
    getById: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.batches.getById),
    update: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.batches.update)
  },
  feed: {
    create: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.feed.create),
    list: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.feed.list),
    getById: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.feed.getById),
    update: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.feed.update)
  },
  audit: {
    create: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.audit.create),
    list: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.audit.list),
    getById: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.audit.getById),
    update: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.audit.update)
  },
  waterQuality: {
    create: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.waterQuality.create),
    list: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.waterQuality.list),
    getById: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.waterQuality.getById),
    update: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.waterQuality.update)
  },
  ai: {
    create: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.ai.create),
    list: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.ai.list),
    getById: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.ai.getById),
    update: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.ai.update),
    explainAlert: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.ai.explainAlert),
    summarizePond: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.ai.summarizePond),
    generateHandover: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.ai.generateHandover),
    rewriteText: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.ai.rewriteText),
    queryDashboard: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.ai.queryDashboard),
    draftIncident: defineEndpointInvocationConfig(aquaPulseEndpointCatalog.ai.draftIncident)
  }
} as const;

export type EndpointInvocationRegistry = typeof endpointInvocationRegistry;

export function flattenEndpointInvocationRegistry(registry: EndpointInvocationRegistry) {
  return {
    [registry.ponds.create.endpointId]: registry.ponds.create,
    [registry.ponds.list.endpointId]: registry.ponds.list,
    [registry.ponds.getById.endpointId]: registry.ponds.getById,
    [registry.ponds.update.endpointId]: registry.ponds.update,
    [registry.ponds.summarize.endpointId]: registry.ponds.summarize,
    [registry.alerts.create.endpointId]: registry.alerts.create,
    [registry.alerts.list.endpointId]: registry.alerts.list,
    [registry.alerts.getById.endpointId]: registry.alerts.getById,
    [registry.alerts.update.endpointId]: registry.alerts.update,
    [registry.alerts.acknowledge.endpointId]: registry.alerts.acknowledge,
    [registry.alerts.resolve.endpointId]: registry.alerts.resolve,
    [registry.alerts.assign.endpointId]: registry.alerts.assign,
    [registry.alerts.unassign.endpointId]: registry.alerts.unassign,
    [registry.alerts.setReviewState.endpointId]: registry.alerts.setReviewState,
    [registry.alerts.explain.endpointId]: registry.alerts.explain,
    [registry.tasks.create.endpointId]: registry.tasks.create,
    [registry.tasks.list.endpointId]: registry.tasks.list,
    [registry.tasks.getById.endpointId]: registry.tasks.getById,
    [registry.tasks.update.endpointId]: registry.tasks.update,
    [registry.attachments.create.endpointId]: registry.attachments.create,
    [registry.attachments.list.endpointId]: registry.attachments.list,
    [registry.attachments.getById.endpointId]: registry.attachments.getById,
    [registry.attachments.update.endpointId]: registry.attachments.update,
    [registry.batches.create.endpointId]: registry.batches.create,
    [registry.batches.list.endpointId]: registry.batches.list,
    [registry.batches.getById.endpointId]: registry.batches.getById,
    [registry.batches.update.endpointId]: registry.batches.update,
    [registry.feed.create.endpointId]: registry.feed.create,
    [registry.feed.list.endpointId]: registry.feed.list,
    [registry.feed.getById.endpointId]: registry.feed.getById,
    [registry.feed.update.endpointId]: registry.feed.update,
    [registry.audit.create.endpointId]: registry.audit.create,
    [registry.audit.list.endpointId]: registry.audit.list,
    [registry.audit.getById.endpointId]: registry.audit.getById,
    [registry.audit.update.endpointId]: registry.audit.update,
    [registry.waterQuality.create.endpointId]: registry.waterQuality.create,
    [registry.waterQuality.list.endpointId]: registry.waterQuality.list,
    [registry.waterQuality.getById.endpointId]: registry.waterQuality.getById,
    [registry.waterQuality.update.endpointId]: registry.waterQuality.update,
    [registry.ai.create.endpointId]: registry.ai.create,
    [registry.ai.list.endpointId]: registry.ai.list,
    [registry.ai.getById.endpointId]: registry.ai.getById,
    [registry.ai.update.endpointId]: registry.ai.update,
    [registry.ai.explainAlert.endpointId]: registry.ai.explainAlert,
    [registry.ai.summarizePond.endpointId]: registry.ai.summarizePond,
    [registry.ai.generateHandover.endpointId]: registry.ai.generateHandover,
    [registry.ai.rewriteText.endpointId]: registry.ai.rewriteText,
    [registry.ai.queryDashboard.endpointId]: registry.ai.queryDashboard,
    [registry.ai.draftIncident.endpointId]: registry.ai.draftIncident
  } as const;
}
