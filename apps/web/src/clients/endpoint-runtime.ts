import type {
  AlertAssignActionRequest,
  AlertLifecycleActionRequest,
  AlertQueueSummary,
  AlertReviewStateActionRequest,
  AlertSummary,
  AlertUnassignActionRequest,
  ApiSuccessEnvelope,
  AttachmentMetadata,
  EndpointRequest,
  EndpointResponse,
  ListResponse,
  FeedCreateRequest,
  FeedEntry,
  FeedUpdateRequest,
  TaskCreateRequest,
  TaskUpdateRequest,
  WaterQualityReading
} from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import type { AquaPulseApiClients } from "./index";

type EndpointCatalog = typeof aquaPulseEndpointCatalog;

type EndpointHandler<TEndpoint> = (
  request: EndpointRequest<TEndpoint>
) => Promise<EndpointResponse<TEndpoint>>;

type ListCapableClient<TItem, TQuery> = {
  list: (query: TQuery) => Promise<ApiSuccessEnvelope<ListResponse<TItem>>>;
};

type DetailCapableClient<TItem> = {
  getById: (id: string) => Promise<{ ok: true; data: TItem }>;
};

type CreateCapableClient<TItem, TInput> = {
  create: (input: TInput) => Promise<{ ok: true; data: TItem }>;
};

type UpdateCapableClient<TItem, TInput> = {
  update: (id: string, input: TInput) => Promise<{ ok: true; data: TItem }>;
};

type AlertActionCapableClient<TItem, TInput> = {
  acknowledge: (id: string, input: TInput) => Promise<{ ok: true; data: TItem }>;
  resolve: (id: string, input: TInput) => Promise<{ ok: true; data: TItem }>;
};

type AlertTriageCapableClient<TItem> = {
  assign: (id: string, input: AlertAssignActionRequest) => Promise<{ ok: true; data: TItem }>;
  unassign: (id: string, input: AlertUnassignActionRequest) => Promise<{ ok: true; data: TItem }>;
  setReviewState: (id: string, input: AlertReviewStateActionRequest) => Promise<{ ok: true; data: TItem }>;
};

function createListHandler<TItem, TQuery>(
  client: ListCapableClient<TItem, TQuery>,
  fallbackQuery: TQuery
) {
  return async (request: TQuery) => client.list(request ?? fallbackQuery);
}

function createDetailHandler<TItem>(
  client: DetailCapableClient<TItem>
) {
  return async (request: { readonly id: string }) => client.getById(request.id);
}

function createMutationFromDetailHandler<TItem, TBody>(
  client: DetailCapableClient<TItem>
) {
  return async (request: { readonly id?: string; readonly body?: TBody }) =>
    client.getById(request.id ?? "placeholder-id");
}

function createMutationFromValue<TRequest, TItem>(
  value: TItem
) {
  return async (_request: TRequest) => ({ ok: true as const, data: value });
}

function createDirectHandler<TRequest, TResponse>(
  execute: (request: TRequest) => Promise<TResponse>
) {
  return async (request: TRequest) => execute(request);
}

function createCreateHandler<TItem, TInput>(
  client: CreateCapableClient<TItem, TInput>
) {
  return async (request: TInput) => client.create(request);
}

function createUpdateHandler<TItem, TInput>(
  client: UpdateCapableClient<TItem, TInput>
) {
  return async (request: { readonly id: string; readonly body: TInput }) =>
    client.update(request.id, request.body);
}

function createAlertActionHandler<TItem, TInput>(
  client:
    | AlertActionCapableClient<TItem, TInput>
    | AlertTriageCapableClient<TItem>,
  action: "acknowledge" | "resolve" | "assign" | "unassign" | "setReviewState"
) {
  return async (request: { readonly id: string; readonly body: TInput }) =>
    (client as Record<string, (id: string, input: TInput) => Promise<{ ok: true; data: TItem }>>)[action](
      request.id,
      request.body
    );
}

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
    summary: EndpointHandler<EndpointCatalog["alerts"]["summary"]>;
    getById: EndpointHandler<EndpointCatalog["alerts"]["getById"]>;
    update: EndpointHandler<EndpointCatalog["alerts"]["update"]>;
    acknowledge: EndpointHandler<EndpointCatalog["alerts"]["acknowledge"]>;
    resolve: EndpointHandler<EndpointCatalog["alerts"]["resolve"]>;
    assign: EndpointHandler<EndpointCatalog["alerts"]["assign"]>;
    unassign: EndpointHandler<EndpointCatalog["alerts"]["unassign"]>;
    setReviewState: EndpointHandler<EndpointCatalog["alerts"]["setReviewState"]>;
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

function placeholderAttachment(): AttachmentMetadata {
  return {
    id: "attachment-1",
    createdAt: "2026-04-13T00:00:00.000Z",
    updatedAt: "2026-04-13T00:00:00.000Z",
    resourceType: "alert",
    resourceId: "alert-1",
    fileName: "sample-photo.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 102400
  };
}

function placeholderFeedEntry(): FeedEntry {
  return {
    id: "feed-1",
    createdAt: "2026-04-13T00:00:00.000Z",
    updatedAt: "2026-04-13T00:00:00.000Z",
    pondId: "pond-1",
    batchId: "batch-1",
    feedType: "Starter Feed",
    quantityKg: 35,
    fedAt: "2026-04-13T00:00:00.000Z"
  };
}

function placeholderWaterQualityReading(): WaterQualityReading {
  return {
    id: "wq-1",
    createdAt: "2026-04-13T00:00:00.000Z",
    updatedAt: "2026-04-13T00:00:00.000Z",
    pondId: "pond-1",
    recordedAt: "2026-04-13T00:00:00.000Z",
    temperatureC: 28.4,
    ph: 7.6
  };
}

function placeholderTaskSummary() {
  return {
    id: "task-1",
    createdAt: "2026-04-13T00:00:00.000Z",
    updatedAt: "2026-04-13T00:00:00.000Z",
    title: "Inspect aeration equipment",
    status: "todo" as const,
    assigneeId: "user-1",
    pondId: "pond-1"
  };
}

export function createEndpointHandlersFromClients(
  clients: AquaPulseApiClients
): AquaPulseEndpointHandlers {
  return {
    ponds: {
      create: createMutationFromDetailHandler(clients.ponds),
      list: createListHandler(clients.ponds, { page: 1, pageSize: 20 }),
      getById: createDetailHandler(clients.ponds),
      update: createMutationFromDetailHandler(clients.ponds),
      summarize: async (request) => clients.ponds.summarize(request)
    },
    alerts: {
      create: createMutationFromDetailHandler(clients.alerts),
      list: createListHandler(clients.alerts, { page: 1, pageSize: 20 }),
      summary:
        "summary" in clients.alerts
          ? createDirectHandler((query: EndpointRequest<EndpointCatalog["alerts"]["summary"]>) =>
              (clients.alerts as typeof clients.alerts & {
                summary: (
                  query: EndpointRequest<EndpointCatalog["alerts"]["summary"]>
                ) => Promise<{ ok: true; data: AlertQueueSummary }>;
              }).summary(query)
            )
          : createMutationFromValue({
              totalAlerts: 0,
              statusCounts: { open: 0, acknowledged: 0, resolved: 0 },
              assignmentCounts: { assigned: 0, unassigned: 0 },
              reviewStateCounts: { unreviewed: 0, underReview: 0, reviewed: 0, deferred: 0 },
              noteCounts: { withLatestNote: 0, withoutLatestNote: 0 },
              severityCounts: { low: 0, medium: 0, high: 0, critical: 0 }
            }),
      getById: createDetailHandler(clients.alerts),
      update: createMutationFromDetailHandler(clients.alerts),
      acknowledge:
        "acknowledge" in clients.alerts
          ? createAlertActionHandler(clients.alerts as typeof clients.alerts & AlertActionCapableClient<
              EndpointResponse<EndpointCatalog["alerts"]["getById"]>["data"],
              AlertLifecycleActionRequest
            >, "acknowledge")
          : createMutationFromDetailHandler(clients.alerts),
      resolve:
        "resolve" in clients.alerts
          ? createAlertActionHandler(clients.alerts as typeof clients.alerts & AlertActionCapableClient<
              EndpointResponse<EndpointCatalog["alerts"]["getById"]>["data"],
              AlertLifecycleActionRequest
            >, "resolve")
          : createMutationFromDetailHandler(clients.alerts),
      assign:
        "assign" in clients.alerts
          ? createAlertActionHandler(clients.alerts as typeof clients.alerts & AlertTriageCapableClient<
              AlertSummary
            >, "assign")
          : createMutationFromDetailHandler(clients.alerts),
      unassign:
        "unassign" in clients.alerts
          ? createAlertActionHandler(clients.alerts as typeof clients.alerts & AlertTriageCapableClient<
              AlertSummary
            >, "unassign")
          : createMutationFromDetailHandler(clients.alerts),
      setReviewState:
        "setReviewState" in clients.alerts
          ? createAlertActionHandler(clients.alerts as typeof clients.alerts & AlertTriageCapableClient<
              AlertSummary
            >, "setReviewState")
          : createMutationFromDetailHandler(clients.alerts),
      explain: async (request) => clients.alerts.explain(request)
    },
    tasks: {
      create:
        "create" in clients.tasks
          ? createCreateHandler(clients.tasks as typeof clients.tasks & {
              create: (input: TaskCreateRequest) => Promise<{
                ok: true;
                data: EndpointResponse<EndpointCatalog["tasks"]["getById"]>["data"];
              }>;
            })
          : createMutationFromValue(placeholderTaskSummary()),
      list: createListHandler(clients.tasks, { page: 1, pageSize: 20 }),
      getById: createDetailHandler(clients.tasks),
      update:
        "update" in clients.tasks
          ? createUpdateHandler(clients.tasks as typeof clients.tasks & {
              update: (id: string, input: TaskUpdateRequest) => Promise<{
                ok: true;
                data: EndpointResponse<EndpointCatalog["tasks"]["getById"]>["data"];
              }>;
            })
          : createMutationFromDetailHandler(clients.tasks)
    },
    attachments: {
      create: createMutationFromValue(placeholderAttachment()),
      list: createListHandler(clients.attachments, { page: 1, pageSize: 20 }),
      getById: createDetailHandler(clients.attachments),
      update: createMutationFromDetailHandler(clients.attachments)
    },
    batches: {
      create: createMutationFromDetailHandler(clients.batches),
      list: createListHandler(clients.batches, { page: 1, pageSize: 20 }),
      getById: createDetailHandler(clients.batches),
      update: createMutationFromDetailHandler(clients.batches)
    },
    feed: {
      create:
        "create" in clients.feed
          ? createCreateHandler(clients.feed as typeof clients.feed & {
              create: (input: FeedCreateRequest) => Promise<{
                ok: true;
                data: FeedEntry;
              }>;
            })
          : createMutationFromValue(placeholderFeedEntry()),
      list: createListHandler(clients.feed, { page: 1, pageSize: 20 }),
      getById: createDetailHandler(clients.feed),
      update:
        "update" in clients.feed
          ? createUpdateHandler(clients.feed as typeof clients.feed & {
              update: (id: string, input: FeedUpdateRequest) => Promise<{
                ok: true;
                data: FeedEntry;
              }>;
            })
          : createMutationFromDetailHandler(clients.feed)
    },
    audit: {
      create: createMutationFromDetailHandler(clients.audit),
      list: createListHandler(clients.audit, { page: 1, pageSize: 20 }),
      getById: createDetailHandler(clients.audit),
      update: createMutationFromDetailHandler(clients.audit)
    },
    waterQuality: {
      create:
        "create" in clients.waterQuality
          ? createCreateHandler(clients.waterQuality as typeof clients.waterQuality & {
              create: (input: EndpointRequest<EndpointCatalog["waterQuality"]["create"]>) => Promise<{
                ok: true;
                data: WaterQualityReading;
              }>;
            })
          : createMutationFromValue(placeholderWaterQualityReading()),
      list: createListHandler<
        EndpointResponse<EndpointCatalog["waterQuality"]["getById"]>["data"],
        EndpointRequest<EndpointCatalog["waterQuality"]["list"]>
      >(clients.waterQuality, { page: 1, pageSize: 20, pondId: "pond-1" }),
      getById: createDetailHandler(clients.waterQuality),
      update: createMutationFromDetailHandler(clients.waterQuality)
    },
    ai: {
      create: createMutationFromDetailHandler(clients.ai),
      list: createListHandler(clients.ai, { page: 1, pageSize: 20 }),
      getById: createDetailHandler(clients.ai),
      update: createMutationFromDetailHandler(clients.ai),
      explainAlert: async (request) => clients.alerts.explain(request),
      summarizePond: async (request) => clients.ponds.summarize(request),
      generateHandover: async (request) => clients.ai.generateHandover(request),
      rewriteText: async (request) => clients.ai.rewriteText(request),
      queryDashboard: async (request) => clients.ai.queryDashboard(request),
      draftIncident: async (request) => clients.ai.draftIncident(request)
    }
  };
}

export function createClientsFromEndpointHandlers(handlers: AquaPulseEndpointHandlers): AquaPulseApiClients {
  return {
    ponds: {
      list: (query) => handlers.ponds.list(query ?? { page: 1, pageSize: 20 }),
      getById: (id) => handlers.ponds.getById({ id }),
      summarize: (input) => handlers.ponds.summarize(input)
    },
    alerts: {
      list: (query) => handlers.alerts.list(query ?? { page: 1, pageSize: 20 }),
      summary: (query) => handlers.alerts.summary(query ?? { page: 1, pageSize: 20 }),
      getById: (id) => handlers.alerts.getById({ id }),
      acknowledge: (id, input) => handlers.alerts.acknowledge({ id, body: input }),
      resolve: (id, input) => handlers.alerts.resolve({ id, body: input }),
      assign: (id, input) => handlers.alerts.assign({ id, body: input }),
      unassign: (id, input) => handlers.alerts.unassign({ id, body: input }),
      setReviewState: (id, input) => handlers.alerts.setReviewState({ id, body: input }),
      explain: (input) => handlers.alerts.explain(input)
    },
    tasks: {
      create: (input) => handlers.tasks.create(input),
      list: (query) => handlers.tasks.list(query ?? { page: 1, pageSize: 20 }),
      getById: (id) => handlers.tasks.getById({ id }),
      update: (id, input) => handlers.tasks.update({ id, body: input })
    },
    attachments: {
      list: (query) => handlers.attachments.list(query ?? { page: 1, pageSize: 20 }),
      getById: (id) => handlers.attachments.getById({ id })
    },
    batches: {
      list: (query) => handlers.batches.list(query ?? { page: 1, pageSize: 20 }),
      getById: (id) => handlers.batches.getById({ id })
    },
    feed: {
      create: (input) => handlers.feed.create(input),
      list: (query) => handlers.feed.list(query ?? { page: 1, pageSize: 20 }),
      getById: (id) => handlers.feed.getById({ id }),
      update: (id, input) => handlers.feed.update({ id, body: input })
    },
    waterQuality: {
      create: (input) => handlers.waterQuality.create(input),
      list: (query) => handlers.waterQuality.list(query),
      getById: (id) => handlers.waterQuality.getById({ id })
    },
    audit: {
      list: (query) => handlers.audit.list(query ?? { page: 1, pageSize: 20 }),
      getById: (id) => handlers.audit.getById({ id })
    },
    ai: {
      list: (query) => handlers.ai.list(query ?? { page: 1, pageSize: 20 }),
      getById: (id) => handlers.ai.getById({ id }),
      rewriteText: (input) => handlers.ai.rewriteText(input),
      queryDashboard: (input) => handlers.ai.queryDashboard(input),
      generateHandover: (input) => handlers.ai.generateHandover(input),
      draftIncident: (input) => handlers.ai.draftIncident(input)
    }
  };
}
