import type {
  AiAlertsExplainRequest,
  AiDashboardQueryRequest,
  AiHandoverGenerateRequest,
  AiIncidentsDraftRequest,
  AiPondsSummarizeRequest,
  AiTextRewriteRequest
} from "@aquapulse/types";
import type { AiApiClient, AlertsApiClient, AuditApiClient, BatchesApiClient, PondsApiClient, TasksApiClient, WaterQualityApiClient } from "../contracts/api";
import { list, ok } from "../lib/api-response";
import { mockAlerts, mockAudit, mockBatches, mockPonds, mockTasks, mockWaterQuality } from "./data";

export const pondsMockAdapter: PondsApiClient = {
  async list() { return ok(list(mockPonds)); },
  async getById(id: string) { return ok(mockPonds.find((item) => item.id === id) ?? mockPonds[0]); },
  async summarize(_input: AiPondsSummarizeRequest) { return ok({ summary: "Placeholder pond summary.", highlights: ["Water quality stable.", "One open alert."] }); }
};
export const batchesMockAdapter: BatchesApiClient = { async list() { return ok(list(mockBatches)); } };
export const waterQualityMockAdapter: WaterQualityApiClient = { async listByPond(pondId: string) { return ok(list(mockWaterQuality.filter((item) => item.pondId === pondId))); } };
export const alertsMockAdapter: AlertsApiClient = {
  async list() { return ok(list(mockAlerts)); },
  async explain(_input: AiAlertsExplainRequest) { return ok({ explanation: "Placeholder explanation for the current alert.", recommendations: ["Inspect aeration equipment.", "Repeat the reading."] }); }
};
export const tasksMockAdapter: TasksApiClient = { async list() { return ok(list(mockTasks)); } };
export const auditMockAdapter: AuditApiClient = { async list() { return ok(list(mockAudit)); } };
export const aiMockAdapter: AiApiClient = {
  async rewriteText(input: AiTextRewriteRequest) { return ok({ rewrittenText: `[placeholder] ${input.text}` }); },
  async queryDashboard(_input: AiDashboardQueryRequest) { return ok({ answer: "Placeholder dashboard answer.", relatedMetrics: ["open_alerts", "active_ponds"] }); },
  async generateHandover(_input: AiHandoverGenerateRequest) { return ok({ summary: "Placeholder handover summary.", actionItems: ["Check alert queue.", "Confirm next feed run."] }); },
  async draftIncident(_input: AiIncidentsDraftRequest) { return ok({ draftTitle: "Placeholder incident draft", draftBody: "Placeholder incident body." }); }
};
