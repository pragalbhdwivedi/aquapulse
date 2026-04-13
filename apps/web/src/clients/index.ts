import type { AiApiClient, AlertsApiClient, AuditApiClient, BatchesApiClient, PondsApiClient, TasksApiClient, WaterQualityApiClient } from "../contracts/api";
import { aiMockAdapter, alertsMockAdapter, auditMockAdapter, batchesMockAdapter, pondsMockAdapter, tasksMockAdapter, waterQualityMockAdapter } from "../mocks/adapters";

export interface AquaPulseApiClients {
  ponds: PondsApiClient;
  batches: BatchesApiClient;
  waterQuality: WaterQualityApiClient;
  alerts: AlertsApiClient;
  tasks: TasksApiClient;
  ai: AiApiClient;
  audit: AuditApiClient;
}

export function createMockApiClients(): AquaPulseApiClients {
  return { ponds: pondsMockAdapter, batches: batchesMockAdapter, waterQuality: waterQualityMockAdapter, alerts: alertsMockAdapter, tasks: tasksMockAdapter, ai: aiMockAdapter, audit: auditMockAdapter };
}

export const apiClients = createMockApiClients();
