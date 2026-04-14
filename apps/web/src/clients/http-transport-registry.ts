import type { EndpointContract, EndpointRequest, EndpointResponse } from "@aquapulse/types";
import type { AquaPulseEndpointHandlers } from "./endpoint-runtime";
import {
  endpointInvocationRegistry,
  flattenEndpointInvocationRegistry,
  type EndpointInvocationRegistry
} from "./invocation-registry";
import { createPlaceholderHttpResponse, type PlaceholderHttpRequest } from "./http-adapters";

type EndpointHandlers = AquaPulseEndpointHandlers;

export function createEndpointHandlerRegistry(handlers: EndpointHandlers) {
  return {
    [endpointInvocationRegistry.ponds.create.endpointId]: handlers.ponds.create,
    [endpointInvocationRegistry.ponds.list.endpointId]: handlers.ponds.list,
    [endpointInvocationRegistry.ponds.getById.endpointId]: handlers.ponds.getById,
    [endpointInvocationRegistry.ponds.update.endpointId]: handlers.ponds.update,
    [endpointInvocationRegistry.ponds.summarize.endpointId]: handlers.ponds.summarize,
    [endpointInvocationRegistry.alerts.create.endpointId]: handlers.alerts.create,
    [endpointInvocationRegistry.alerts.list.endpointId]: handlers.alerts.list,
    [endpointInvocationRegistry.alerts.getById.endpointId]: handlers.alerts.getById,
    [endpointInvocationRegistry.alerts.update.endpointId]: handlers.alerts.update,
    [endpointInvocationRegistry.alerts.explain.endpointId]: handlers.alerts.explain,
    [endpointInvocationRegistry.tasks.create.endpointId]: handlers.tasks.create,
    [endpointInvocationRegistry.tasks.list.endpointId]: handlers.tasks.list,
    [endpointInvocationRegistry.tasks.getById.endpointId]: handlers.tasks.getById,
    [endpointInvocationRegistry.tasks.update.endpointId]: handlers.tasks.update,
    [endpointInvocationRegistry.attachments.create.endpointId]: handlers.attachments.create,
    [endpointInvocationRegistry.attachments.list.endpointId]: handlers.attachments.list,
    [endpointInvocationRegistry.attachments.getById.endpointId]: handlers.attachments.getById,
    [endpointInvocationRegistry.attachments.update.endpointId]: handlers.attachments.update,
    [endpointInvocationRegistry.batches.create.endpointId]: handlers.batches.create,
    [endpointInvocationRegistry.batches.list.endpointId]: handlers.batches.list,
    [endpointInvocationRegistry.batches.getById.endpointId]: handlers.batches.getById,
    [endpointInvocationRegistry.batches.update.endpointId]: handlers.batches.update,
    [endpointInvocationRegistry.feed.create.endpointId]: handlers.feed.create,
    [endpointInvocationRegistry.feed.list.endpointId]: handlers.feed.list,
    [endpointInvocationRegistry.feed.getById.endpointId]: handlers.feed.getById,
    [endpointInvocationRegistry.feed.update.endpointId]: handlers.feed.update,
    [endpointInvocationRegistry.audit.create.endpointId]: handlers.audit.create,
    [endpointInvocationRegistry.audit.list.endpointId]: handlers.audit.list,
    [endpointInvocationRegistry.audit.getById.endpointId]: handlers.audit.getById,
    [endpointInvocationRegistry.audit.update.endpointId]: handlers.audit.update,
    [endpointInvocationRegistry.waterQuality.create.endpointId]: handlers.waterQuality.create,
    [endpointInvocationRegistry.waterQuality.list.endpointId]: handlers.waterQuality.list,
    [endpointInvocationRegistry.waterQuality.getById.endpointId]: handlers.waterQuality.getById,
    [endpointInvocationRegistry.waterQuality.update.endpointId]: handlers.waterQuality.update,
    [endpointInvocationRegistry.ai.create.endpointId]: handlers.ai.create,
    [endpointInvocationRegistry.ai.list.endpointId]: handlers.ai.list,
    [endpointInvocationRegistry.ai.getById.endpointId]: handlers.ai.getById,
    [endpointInvocationRegistry.ai.update.endpointId]: handlers.ai.update,
    [endpointInvocationRegistry.ai.explainAlert.endpointId]: handlers.ai.explainAlert,
    [endpointInvocationRegistry.ai.summarizePond.endpointId]: handlers.ai.summarizePond,
    [endpointInvocationRegistry.ai.generateHandover.endpointId]: handlers.ai.generateHandover,
    [endpointInvocationRegistry.ai.rewriteText.endpointId]: handlers.ai.rewriteText,
    [endpointInvocationRegistry.ai.queryDashboard.endpointId]: handlers.ai.queryDashboard,
    [endpointInvocationRegistry.ai.draftIncident.endpointId]: handlers.ai.draftIncident
  } as const;
}

export function createPlaceholderHttpTransportRegistry(
  handlers: EndpointHandlers,
  registry: EndpointInvocationRegistry = endpointInvocationRegistry
) {
  const flattenedRegistry = flattenEndpointInvocationRegistry(registry) as Record<
    string,
    {
      adaptResponse: (response: unknown) => unknown;
    }
  >;
  const handlerRegistry = createEndpointHandlerRegistry(handlers);

  return {
    async invoke<TEndpoint extends EndpointContract<unknown, unknown>>(
      request: PlaceholderHttpRequest<TEndpoint>,
      input: EndpointRequest<TEndpoint>
    ) {
      const invocation = flattenedRegistry[request.endpointId];
      const handler = handlerRegistry[request.endpointId] as unknown as (
        input: EndpointRequest<TEndpoint>
      ) => Promise<EndpointResponse<TEndpoint>>;
      const output = await handler(input);
      return createPlaceholderHttpResponse(
        invocation.adaptResponse(createPlaceholderHttpResponse(output)) as EndpointResponse<TEndpoint>
      );
    }
  };
}
