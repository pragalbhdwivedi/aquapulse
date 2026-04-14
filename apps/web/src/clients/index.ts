import type {
  AiApiClient,
  AlertsApiClient,
  AuditApiClient,
  BatchesApiClient,
  PondsApiClient,
  TasksApiClient,
  WaterQualityApiClient
} from "../contracts/api";
import { createClientsFromEndpointHandlers, createEndpointHandlersFromClients } from "./endpoint-runtime";
import {
  aiMockAdapter,
  alertsMockAdapter,
  auditMockAdapter,
  batchesMockAdapter,
  pondsMockAdapter,
  tasksMockAdapter,
  waterQualityMockAdapter
} from "../mocks/adapters";

export interface AquaPulseApiClients {
  ponds: PondsApiClient;
  batches: BatchesApiClient;
  waterQuality: WaterQualityApiClient;
  alerts: AlertsApiClient;
  tasks: TasksApiClient;
  ai: AiApiClient;
  audit: AuditApiClient;
}

export type AquaPulseClientSource = "mock" | "http";

export function createMockApiClients(): AquaPulseApiClients {
  return {
    ponds: pondsMockAdapter,
    batches: batchesMockAdapter,
    waterQuality: waterQualityMockAdapter,
    alerts: alertsMockAdapter,
    tasks: tasksMockAdapter,
    ai: aiMockAdapter,
    audit: auditMockAdapter
  };
}

export function createHttpPlaceholderClients(): AquaPulseApiClients {
  const handlers = createEndpointHandlersFromClients(createMockApiClients());
  return createClientsFromEndpointHandlers(handlers);
}

export interface AquaPulseClientRuntimeRegistry {
  readonly mock: () => AquaPulseApiClients;
  readonly http: () => AquaPulseApiClients;
}

export function createClientRuntimeRegistry(): AquaPulseClientRuntimeRegistry {
  return {
    mock: () => createMockApiClients(),
    http: () => createHttpPlaceholderClients()
  };
}

export function createApiClients(source: AquaPulseClientSource = "mock"): AquaPulseApiClients {
  const registry = createClientRuntimeRegistry();
  return registry[source]();
}

export const apiClients = createApiClients();
