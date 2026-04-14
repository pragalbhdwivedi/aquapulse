import type {
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
import { createHttpPlaceholderClients as createDelegatedHttpPlaceholderClients } from "./http-placeholder";
import {
  getDefaultClientRuntimeConfig,
  parseClientRuntimeConfig,
  type AquaPulseClientRuntimeConfig,
  type AquaPulseClientRuntimeEnv,
  type AquaPulseClientRuntimeMode
} from "./runtime-config";

export interface AquaPulseApiClients {
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

export function createMockApiClients(): AquaPulseApiClients {
  return {
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
  return createApiClients(config.mode);
}

export function createApiClientsFromEnv(
  env: AquaPulseClientRuntimeEnv = {}
): AquaPulseApiClients {
  return createApiClientsFromConfig(parseClientRuntimeConfig(env));
}

export const apiClients = createApiClientsFromConfig(getDefaultClientRuntimeConfig());
