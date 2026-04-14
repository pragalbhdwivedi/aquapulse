import type { EndpointRequest, EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import type {
  AiApiClient,
  AlertsApiClient,
  AuditApiClient,
  BatchesApiClient,
  PondsApiClient,
  TasksApiClient,
  WaterQualityApiClient
} from "../contracts/api";

type EndpointCatalog = typeof aquaPulseEndpointCatalog;

type EndpointHandler<TEndpoint> = (
  request: EndpointRequest<TEndpoint>
) => Promise<EndpointResponse<TEndpoint>>;

export interface AquaPulseEndpointHandlers {
  ponds: {
    create: EndpointHandler<EndpointCatalog["ponds"]["create"]>;
    list: EndpointHandler<EndpointCatalog["ponds"]["list"]>;
    getById: EndpointHandler<EndpointCatalog["ponds"]["getById"]>;
    update: EndpointHandler<EndpointCatalog["ponds"]["update"]>;
    summarize: EndpointHandler<EndpointCatalog["ponds"]["summarize"]>;
  };
  alerts: {
    create: EndpointHandler<EndpointCatalog["alerts"]["create"]>;
    list: EndpointHandler<EndpointCatalog["alerts"]["list"]>;
    getById: EndpointHandler<EndpointCatalog["alerts"]["getById"]>;
    update: EndpointHandler<EndpointCatalog["alerts"]["update"]>;
    explain: EndpointHandler<EndpointCatalog["alerts"]["explain"]>;
  };
  tasks: {
    create: EndpointHandler<EndpointCatalog["tasks"]["create"]>;
    list: EndpointHandler<EndpointCatalog["tasks"]["list"]>;
    getById: EndpointHandler<EndpointCatalog["tasks"]["getById"]>;
    update: EndpointHandler<EndpointCatalog["tasks"]["update"]>;
  };
  attachments: {
    create: EndpointHandler<EndpointCatalog["attachments"]["create"]>;
    list: EndpointHandler<EndpointCatalog["attachments"]["list"]>;
    getById: EndpointHandler<EndpointCatalog["attachments"]["getById"]>;
    update: EndpointHandler<EndpointCatalog["attachments"]["update"]>;
  };
  batches: {
    create: EndpointHandler<EndpointCatalog["batches"]["create"]>;
    list: EndpointHandler<EndpointCatalog["batches"]["list"]>;
    getById: EndpointHandler<EndpointCatalog["batches"]["getById"]>;
    update: EndpointHandler<EndpointCatalog["batches"]["update"]>;
  };
  feed: {
    create: EndpointHandler<EndpointCatalog["feed"]["create"]>;
    list: EndpointHandler<EndpointCatalog["feed"]["list"]>;
    getById: EndpointHandler<EndpointCatalog["feed"]["getById"]>;
    update: EndpointHandler<EndpointCatalog["feed"]["update"]>;
  };
  audit: {
    create: EndpointHandler<EndpointCatalog["audit"]["create"]>;
    list: EndpointHandler<EndpointCatalog["audit"]["list"]>;
    getById: EndpointHandler<EndpointCatalog["audit"]["getById"]>;
    update: EndpointHandler<EndpointCatalog["audit"]["update"]>;
  };
  waterQuality: {
    create: EndpointHandler<EndpointCatalog["waterQuality"]["create"]>;
    list: EndpointHandler<EndpointCatalog["waterQuality"]["list"]>;
    getById: EndpointHandler<EndpointCatalog["waterQuality"]["getById"]>;
    update: EndpointHandler<EndpointCatalog["waterQuality"]["update"]>;
  };
  ai: {
    create: EndpointHandler<EndpointCatalog["ai"]["create"]>;
    list: EndpointHandler<EndpointCatalog["ai"]["list"]>;
    getById: EndpointHandler<EndpointCatalog["ai"]["getById"]>;
    update: EndpointHandler<EndpointCatalog["ai"]["update"]>;
    explainAlert: EndpointHandler<EndpointCatalog["ai"]["explainAlert"]>;
    summarizePond: EndpointHandler<EndpointCatalog["ai"]["summarizePond"]>;
    generateHandover: EndpointHandler<EndpointCatalog["ai"]["generateHandover"]>;
    rewriteText: EndpointHandler<EndpointCatalog["ai"]["rewriteText"]>;
    queryDashboard: EndpointHandler<EndpointCatalog["ai"]["queryDashboard"]>;
    draftIncident: EndpointHandler<EndpointCatalog["ai"]["draftIncident"]>;
  };
}

export interface MinimalAquaPulseClients {
  ponds: Pick<PondsApiClient, "list" | "getById" | "summarize">;
  alerts: Pick<AlertsApiClient, "list" | "explain">;
  tasks: Pick<TasksApiClient, "list">;
  batches: Pick<BatchesApiClient, "list">;
  waterQuality: Pick<WaterQualityApiClient, "list">;
  audit: Pick<AuditApiClient, "list">;
  ai: Pick<AiApiClient, "rewriteText" | "queryDashboard" | "generateHandover" | "draftIncident">;
}

export function createEndpointHandlersFromClients(
  clients: MinimalAquaPulseClients
): AquaPulseEndpointHandlers {
  return {
    ponds: {
      create: async () => clients.ponds.getById("pond-1"),
      list: async (request) => clients.ponds.list(request),
      getById: async (request) => clients.ponds.getById(request.id),
      update: async (request) => clients.ponds.getById(request.id),
      summarize: async (request) => clients.ponds.summarize(request)
    },
    alerts: {
      create: async () => {
        const list = await clients.alerts.list({ page: 1, pageSize: 20 });
        return { ok: true, data: list.data.items[0] };
      },
      list: async (request) => clients.alerts.list(request),
      getById: async (request) => {
        const list = await clients.alerts.list({ page: 1, pageSize: 20 });
        return { ok: true, data: list.data.items.find((item) => item.id === request.id) ?? list.data.items[0] };
      },
      update: async (request) => {
        const list = await clients.alerts.list({ page: 1, pageSize: 20 });
        return { ok: true, data: list.data.items.find((item) => item.id === request.id) ?? list.data.items[0] };
      },
      explain: async (request) => clients.alerts.explain(request)
    },
    tasks: {
      create: async () => {
        const list = await clients.tasks.list({ page: 1, pageSize: 20 });
        return { ok: true, data: list.data.items[0] };
      },
      list: async (request) => clients.tasks.list(request),
      getById: async (request) => {
        const list = await clients.tasks.list({ page: 1, pageSize: 20 });
        return { ok: true, data: list.data.items.find((item) => item.id === request.id) ?? list.data.items[0] };
      },
      update: async (request) => {
        const list = await clients.tasks.list({ page: 1, pageSize: 20 });
        return { ok: true, data: list.data.items.find((item) => item.id === request.id) ?? list.data.items[0] };
      }
    },
    attachments: {
      create: async () => ({ ok: true, data: { id: "attachment-1", createdAt: "2026-04-13T00:00:00.000Z", updatedAt: "2026-04-13T00:00:00.000Z", resourceType: "alert", resourceId: "alert-1", fileName: "sample-photo.jpg", mimeType: "image/jpeg", sizeBytes: 102400 } }),
      list: async () => ({ ok: true, data: { items: [], page: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 } } }),
      getById: async () => ({ ok: true, data: { id: "attachment-1", createdAt: "2026-04-13T00:00:00.000Z", updatedAt: "2026-04-13T00:00:00.000Z", resourceType: "alert", resourceId: "alert-1", fileName: "sample-photo.jpg", mimeType: "image/jpeg", sizeBytes: 102400 } }),
      update: async () => ({ ok: true, data: { id: "attachment-1", createdAt: "2026-04-13T00:00:00.000Z", updatedAt: "2026-04-13T00:00:00.000Z", resourceType: "alert", resourceId: "alert-1", fileName: "sample-photo.jpg", mimeType: "image/jpeg", sizeBytes: 102400 } })
    },
    batches: {
      create: async () => ({ ok: true, data: (await clients.batches.list({ page: 1, pageSize: 20 })).data.items[0] }),
      list: async (request) => clients.batches.list(request),
      getById: async (request) => {
        const list = await clients.batches.list({ page: 1, pageSize: 20 });
        return { ok: true, data: list.data.items.find((item) => item.id === request.id) ?? list.data.items[0] };
      },
      update: async (request) => {
        const list = await clients.batches.list({ page: 1, pageSize: 20 });
        return { ok: true, data: list.data.items.find((item) => item.id === request.id) ?? list.data.items[0] };
      }
    },
    feed: {
      create: async () => ({ ok: true, data: { id: "feed-1", createdAt: "2026-04-13T00:00:00.000Z", updatedAt: "2026-04-13T00:00:00.000Z", pondId: "pond-1", batchId: "batch-1", feedType: "Starter Feed", quantityKg: 35, fedAt: "2026-04-13T00:00:00.000Z" } }),
      list: async () => ({ ok: true, data: { items: [], page: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 } } }),
      getById: async () => ({ ok: true, data: { id: "feed-1", createdAt: "2026-04-13T00:00:00.000Z", updatedAt: "2026-04-13T00:00:00.000Z", pondId: "pond-1", batchId: "batch-1", feedType: "Starter Feed", quantityKg: 35, fedAt: "2026-04-13T00:00:00.000Z" } }),
      update: async () => ({ ok: true, data: { id: "feed-1", createdAt: "2026-04-13T00:00:00.000Z", updatedAt: "2026-04-13T00:00:00.000Z", pondId: "pond-1", batchId: "batch-1", feedType: "Starter Feed", quantityKg: 35, fedAt: "2026-04-13T00:00:00.000Z" } })
    },
    audit: {
      create: async () => ({ ok: true, data: (await clients.audit.list({ page: 1, pageSize: 20 })).data.items[0] }),
      list: async (request) => clients.audit.list(request),
      getById: async (request) => {
        const list = await clients.audit.list({ page: 1, pageSize: 20 });
        return { ok: true, data: list.data.items.find((item) => item.id === request.id) ?? list.data.items[0] };
      },
      update: async (request) => {
        const list = await clients.audit.list({ page: 1, pageSize: 20 });
        return { ok: true, data: list.data.items.find((item) => item.id === request.id) ?? list.data.items[0] };
      }
    },
    waterQuality: {
      create: async () => ({ ok: true, data: (await clients.waterQuality.list({ page: 1, pageSize: 20, pondId: "pond-1" })).data.items[0] }),
      list: async (request) => clients.waterQuality.list(request),
      getById: async (request) => {
        const list = await clients.waterQuality.list({ page: 1, pageSize: 20, pondId: "pond-1" });
        return { ok: true, data: list.data.items.find((item) => item.id === request.id) ?? list.data.items[0] };
      },
      update: async (request) => {
        const list = await clients.waterQuality.list({ page: 1, pageSize: 20, pondId: "pond-1" });
        return { ok: true, data: list.data.items.find((item) => item.id === request.id) ?? list.data.items[0] };
      }
    },
    ai: {
      create: async () => ({ ok: true, data: { id: "ai-response-1", createdAt: "2026-04-13T00:00:00.000Z", updatedAt: "2026-04-13T00:00:00.000Z", requestId: "ai-request-1", status: "completed", outputText: "Placeholder", model: "gpt-5.4" } }),
      list: async () => ({ ok: true, data: { items: [], page: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 } } }),
      getById: async () => ({ ok: true, data: { id: "ai-response-1", createdAt: "2026-04-13T00:00:00.000Z", updatedAt: "2026-04-13T00:00:00.000Z", requestId: "ai-request-1", status: "completed", outputText: "Placeholder", model: "gpt-5.4" } }),
      update: async () => ({ ok: true, data: { id: "ai-response-1", createdAt: "2026-04-13T00:00:00.000Z", updatedAt: "2026-04-13T00:00:00.000Z", requestId: "ai-request-1", status: "completed", outputText: "Placeholder", model: "gpt-5.4" } }),
      explainAlert: async (request) => clients.alerts.explain(request),
      summarizePond: async (request) => clients.ponds.summarize(request),
      generateHandover: async (request) => clients.ai.generateHandover(request),
      rewriteText: async (request) => clients.ai.rewriteText(request),
      queryDashboard: async (request) => clients.ai.queryDashboard(request),
      draftIncident: async (request) => clients.ai.draftIncident(request)
    }
  };
}

export function createClientsFromEndpointHandlers(handlers: AquaPulseEndpointHandlers): MinimalAquaPulseClients {
  return {
    ponds: {
      list: (query) => handlers.ponds.list(query ?? { page: 1, pageSize: 20 }),
      getById: (id) => handlers.ponds.getById({ id }),
      summarize: (input) => handlers.ponds.summarize(input)
    },
    alerts: {
      list: (query) => handlers.alerts.list(query ?? { page: 1, pageSize: 20 }),
      explain: (input) => handlers.alerts.explain(input)
    },
    tasks: {
      list: (query) => handlers.tasks.list(query ?? { page: 1, pageSize: 20 })
    },
    batches: {
      list: (query) => handlers.batches.list(query ?? { page: 1, pageSize: 20 })
    },
    waterQuality: {
      list: (query) => handlers.waterQuality.list(query)
    },
    audit: {
      list: (query) => handlers.audit.list(query ?? { page: 1, pageSize: 20 })
    },
    ai: {
      rewriteText: (input) => handlers.ai.rewriteText(input),
      queryDashboard: (input) => handlers.ai.queryDashboard(input),
      generateHandover: (input) => handlers.ai.generateHandover(input),
      draftIncident: (input) => handlers.ai.draftIncident(input)
    }
  };
}
