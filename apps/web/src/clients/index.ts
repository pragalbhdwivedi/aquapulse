import type {
  AuthApiClient,
  AiApiClient,
  AlertsApiClient,
  AttachmentsApiClient,
  AuditApiClient,
  BatchesApiClient,
  FeedApiClient,
  PondsApiClient,
  TasksApiClient,
  WaterQualityApiClient
} from "../contracts/api";
import {
  aiMockAdapter,
  alertsMockAdapter,
  attachmentsMockAdapter,
  auditMockAdapter,
  batchesMockAdapter,
  feedMockAdapter,
  pondsMockAdapter,
  tasksMockAdapter,
  waterQualityMockAdapter
} from "../mocks/adapters";
import { createFetchHttpExecutor } from "./fetch-http-executor";
import { createHttpPlaceholderClients as createDelegatedHttpPlaceholderClients } from "./http-placeholder";
import { createHttpClientFactory } from "./http-client-factory";
import {
  getDefaultClientRuntimeConfig,
  parseClientRuntimeConfig,
  resolveAlertsHttpBaseUrl,
  resolveFeedHttpBaseUrl,
  resolvePondsHttpBaseUrl,
  resolveTasksHttpBaseUrl,
  resolveWaterQualityHttpBaseUrl,
  type AquaPulseHttpTransportMode,
  type AquaPulseClientRuntimeConfig,
  type AquaPulseClientRuntimeEnv,
  type AquaPulseClientRuntimeMode,
  type AquaPulseScopedRuntimeMode
} from "./runtime-config";

export interface AquaPulseApiClients {
  auth: AuthApiClient;
  ponds: PondsApiClient;
  batches: BatchesApiClient;
  waterQuality: WaterQualityApiClient;
  alerts: AlertsApiClient;
  tasks: TasksApiClient;
  attachments: AttachmentsApiClient;
  feed: FeedApiClient;
  ai: AiApiClient;
  audit: AuditApiClient;
}

export type AquaPulseClientSource = AquaPulseClientRuntimeMode;

function resolveScopedFetchBaseUrl(
  config: AquaPulseClientRuntimeConfig,
  mode: AquaPulseScopedRuntimeMode | undefined,
  transport: AquaPulseHttpTransportMode | undefined,
  resolvedBaseUrl: string | undefined
): string | undefined {
  if (mode === "http" && (transport ?? "proxy") === "proxy" && config.localApiBackendUrl) {
    return config.localApiBackendUrl;
  }

  return resolvedBaseUrl;
}

export function createMockApiClients(): AquaPulseApiClients {
  return {
    auth: {
      async getSession() {
        return {
          ok: true,
          data: {
            requestedMode: "disabled",
            effectiveMode: "disabled",
            availabilityState: "disabled",
            authSource: "none",
            sessionPresent: false,
            protectedReadSliceLabel: "alerts_list_read",
            protectedReadSliceEnforced: false,
            secondaryProtectedReadSliceLabel: "alerts_detail_read",
            secondaryProtectedReadSliceEnforced: false,
            tertiaryProtectedReadSliceLabel: "alerts_summary_read",
            tertiaryProtectedReadSliceEnforced: false,
            protectedOperatorSliceLabel: "alerts_lifecycle_actions",
            protectedOperatorSliceEnforced: false,
            secondaryProtectedSliceLabel: "alerts_triage_actions",
            secondaryProtectedSliceEnforced: false,
            tertiaryProtectedSliceLabel: "alerts_bulk_actions",
            tertiaryProtectedSliceEnforced: false,
            quaternaryProtectedSliceLabel: "alerts_saved_view_mutations",
            quaternaryProtectedSliceEnforced: false,
            nonAlertsOperatorAccessSummaryLabel: "non_alert_operator_update_access",
            nonAlertsOperatorAccessSummaryEnforced: false,
            nonAlertsProtectedSliceLabel: "tasks_update",
            nonAlertsProtectedSliceEnforced: false,
            secondaryNonAlertsProtectedSliceLabel: "feed_update",
            secondaryNonAlertsProtectedSliceEnforced: false,
            tertiaryNonAlertsProtectedSliceLabel: "ponds_update",
            tertiaryNonAlertsProtectedSliceEnforced: false,
            quaternaryNonAlertsProtectedSliceLabel: "water_quality_create",
            quaternaryNonAlertsProtectedSliceEnforced: false,
            quinaryNonAlertsProtectedSliceLabel: "water_quality_update",
            quinaryNonAlertsProtectedSliceEnforced: false,
            senaryNonAlertsProtectedSliceLabel: "feed_create",
            senaryNonAlertsProtectedSliceEnforced: false,
            verificationState: "disabled",
            warnings: []
          }
        };
      }
    },
    ponds: pondsMockAdapter,
    batches: batchesMockAdapter,
    waterQuality: waterQualityMockAdapter,
    alerts: alertsMockAdapter,
    tasks: tasksMockAdapter,
    attachments: attachmentsMockAdapter,
    feed: feedMockAdapter,
    ai: aiMockAdapter,
    audit: auditMockAdapter
  };
}

export interface AquaPulseClientRuntimeRegistry {
  readonly mock: () => AquaPulseApiClients;
  readonly http: () => AquaPulseApiClients;
}

export function createClientRuntimeRegistry(): AquaPulseClientRuntimeRegistry {
  return {
    mock: () => createMockApiClients(),
    http: () => createDelegatedHttpPlaceholderClients(createMockApiClients())
  };
}

export function createHttpPlaceholderClients(clients = createMockApiClients()): AquaPulseApiClients {
  return createDelegatedHttpPlaceholderClients(clients);
}

export function createApiClients(source: AquaPulseClientSource = "mock"): AquaPulseApiClients {
  const registry = createClientRuntimeRegistry();
  return registry[source]();
}

export function createApiClientsFromConfig(
  config: AquaPulseClientRuntimeConfig
): AquaPulseApiClients {
  const baseClients = createApiClients("mock");

  let clients =
    config.mode === "http" && config.enablePlaceholderHttp
      ? createDelegatedHttpPlaceholderClients(baseClients)
      : baseClients;

  if (config.alertsMode === "http") {
    const alertsHttpClients = config.enableFetchHttp
      ? createHttpClientFactory({
          config: {
            ...config,
            mode: "http"
          },
          baseClients,
          executor: createFetchHttpExecutor({
            baseUrl: resolveScopedFetchBaseUrl(
              config,
              config.alertsMode,
              config.alertsHttpTransport,
              resolveAlertsHttpBaseUrl(config)
            )
          })
        })
      : config.enablePlaceholderHttp
        ? createDelegatedHttpPlaceholderClients(baseClients)
        : baseClients;

    clients = {
      ...clients,
      alerts: alertsHttpClients.alerts
    };
  }

  if (config.feedMode === "http") {
    const feedHttpClients = config.enableFetchHttp
      ? createHttpClientFactory({
          config: {
            ...config,
            mode: "http"
          },
          baseClients,
          executor: createFetchHttpExecutor({
            baseUrl: resolveScopedFetchBaseUrl(
              config,
              config.feedMode,
              config.feedHttpTransport,
              resolveFeedHttpBaseUrl(config)
            )
          })
        })
      : config.enablePlaceholderHttp
        ? createDelegatedHttpPlaceholderClients(baseClients)
        : baseClients;

    clients = {
      ...clients,
      feed: feedHttpClients.feed
    };
  }

  if (config.pondsMode === "http") {
    const pondsHttpClients = config.enableFetchHttp
      ? createHttpClientFactory({
          config: {
            ...config,
            mode: "http"
          },
          baseClients,
          executor: createFetchHttpExecutor({
            baseUrl: resolveScopedFetchBaseUrl(
              config,
              config.pondsMode,
              config.pondsHttpTransport,
              resolvePondsHttpBaseUrl(config)
            )
          })
        })
      : config.enablePlaceholderHttp
        ? createDelegatedHttpPlaceholderClients(baseClients)
        : baseClients;

    clients = {
      ...clients,
      ponds: pondsHttpClients.ponds
    };
  }

  if (config.tasksMode === "http") {
    const tasksHttpClients = config.enableFetchHttp
      ? createHttpClientFactory({
          config: {
            ...config,
            mode: "http"
          },
          baseClients,
          executor: createFetchHttpExecutor({
            baseUrl: resolveScopedFetchBaseUrl(
              config,
              config.tasksMode,
              config.tasksHttpTransport,
              resolveTasksHttpBaseUrl(config)
            )
          })
        })
      : config.enablePlaceholderHttp
        ? createDelegatedHttpPlaceholderClients(baseClients)
        : baseClients;

    clients = {
      ...clients,
      tasks: tasksHttpClients.tasks
    };
  }

  if (config.waterQualityMode === "http") {
    const waterQualityHttpClients = config.enableFetchHttp
      ? createHttpClientFactory({
          config: {
            ...config,
            mode: "http"
          },
          baseClients,
          executor: createFetchHttpExecutor({
            baseUrl: resolveScopedFetchBaseUrl(
              config,
              config.waterQualityMode,
              config.waterQualityHttpTransport,
              resolveWaterQualityHttpBaseUrl(config)
            )
          })
        })
      : config.enablePlaceholderHttp
        ? createDelegatedHttpPlaceholderClients(baseClients)
        : baseClients;

    clients = {
      ...clients,
      waterQuality: waterQualityHttpClients.waterQuality
    };
  }

  if (config.mode === "http" && config.enableFetchHttp) {
    return createHttpClientFactory({
      config: {
        ...config,
        mode: "http"
      },
      baseClients: clients,
      executor: createFetchHttpExecutor({
        baseUrl: config.httpBaseUrl
      })
    });
  }

  return clients;
}

export function createApiClientsFromEnv(
  env: AquaPulseClientRuntimeEnv = {}
): AquaPulseApiClients {
  return createApiClientsFromConfig(parseClientRuntimeConfig(env));
}

export const apiClients = createApiClientsFromConfig(getDefaultClientRuntimeConfig());
