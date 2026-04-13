import type {
  AiAlertsExplainRequest,
  AiDashboardQueryRequest,
  AiHandoverGenerateRequest,
  AiIncidentsDraftRequest,
  AiPondsSummarizeRequest,
  AiTextRewriteRequest,
} from "@aquapulse/types";
import type {
  AiApiContract,
  AlertsApiContract,
  AuditApiContract,
  BatchesApiContract,
  PondsApiContract,
  TasksApiContract,
  WaterQualityApiContract,
} from "../contracts/api";
import { list, ok } from "../lib/api-response";
import {
  mockAlerts,
  mockAuditEvents,
  mockBatches,
  mockPonds,
  mockTasks,
  mockWaterQualityReadings,
} from "./data";

export const pondsMockAdapter: PondsApiContract = {
  async list() {
    return ok(list(mockPonds));
  },
  async getById(pondId: string) {
    return ok(mockPonds.find((pond) => pond.id === pondId) ?? mockPonds[0]);
  },
  async summarize(_request: AiPondsSummarizeRequest) {
    return ok({
      summary: "Placeholder pond summary generated from mock operational data.",
      highlights: ["Water quality is stable.", "One active alert is open for review."],
    });
  },
};

export const batchesMockAdapter: BatchesApiContract = {
  async list() {
    return ok(list(mockBatches));
  },
};

export const waterQualityMockAdapter: WaterQualityApiContract = {
  async listByPond(pondId: string) {
    return ok(list(mockWaterQualityReadings.filter((reading) => reading.pondId === pondId)));
  },
};

export const alertsMockAdapter: AlertsApiContract = {
  async list() {
    return ok(list(mockAlerts));
  },
  async explain(_request: AiAlertsExplainRequest) {
    return ok({
      explanation: "This placeholder explanation links the alert to recent water-quality drift.",
      recommendations: ["Inspect aeration equipment.", "Repeat the water-quality reading."],
    });
  },
};

export const tasksMockAdapter: TasksApiContract = {
  async list() {
    return ok(list(mockTasks));
  },
};

export const auditMockAdapter: AuditApiContract = {
  async list() {
    return ok(list(mockAuditEvents));
  },
};

export const aiMockAdapter: AiApiContract = {
  async rewriteText(request: AiTextRewriteRequest) {
    return ok({
      rewrittenText: `[${request.tone}] ${request.text}`,
    });
  },
  async queryDashboard(_request: AiDashboardQueryRequest) {
    return ok({
      answer: "Placeholder dashboard answer derived from mock alerts, ponds, and tasks.",
      relatedMetrics: ["open_alerts", "active_ponds", "pending_tasks"],
    });
  },
  async generateHandover(_request: AiHandoverGenerateRequest) {
    return ok({
      summary: "Placeholder handover summary for the next shift.",
      actionItems: ["Review alert alert-1.", "Confirm the next feeding window."],
    });
  },
  async draftIncident(_request: AiIncidentsDraftRequest) {
    return ok({
      draftTitle: "Placeholder incident draft",
      draftBody: "This placeholder incident draft should be replaced by a real AI orchestration flow later.",
    });
  },
};
