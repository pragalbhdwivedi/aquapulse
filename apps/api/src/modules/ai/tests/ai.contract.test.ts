import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type {
  AiActionDraftRecord,
  AiAlertsExplainResponse,
  AiDashboardQueryResponse,
  AiFeedbackRecord,
  AiPromptTemplateRecord,
  AiRequestRecord,
  AiResponseRecord,
  ApiSuccessEnvelope,
  ListResponse
} from "@aquapulse/types";
import { DashboardQueryDto, ExplainAlertDto, QueryAiDto } from "../dto";
import {
  toAiAlertsExplainResponse,
  toAiDashboardQueryResponse,
  toAiItemResponse,
  toAiListResponse
} from "../mappers/ai.mapper";
import type { AiRepositoryPort } from "../ports/ai-repository.port";
import { AiApplicationService } from "../application/ai.application-service";
import { AiController } from "../ai.controller";

const explainResponse: AiAlertsExplainResponse = {
  summary: "Placeholder AI explanation for an alert.",
  explanation: "Placeholder AI explanation for an alert.",
  recommendations: ["Inspect aeration equipment."],
  likelyCauses: [],
  recommendedChecks: [],
  suggestedActions: [],
  confidenceNote: "Confidence is limited in this placeholder response.",
  advisoryDisclaimer:
    "Advisory only. AquaPulse will not mutate alerts from explanation output.",
  metadata: {
    mode: "fallback",
    advisoryOnly: true,
    generatedAt: "2026-04-16T00:00:00.000Z",
    modelLabel: "gpt-5-nano",
    sourceLabel: "test_placeholder",
    usedLiveOpenAi: false
  }
};

const aiRecord: AiResponseRecord = {
  id: "ai-response-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  requestId: "ai-request-1",
  status: "draft",
  outputText: "Placeholder AI output",
  model: "gpt-placeholder"
};

const aiList: ListResponse<AiResponseRecord> = {
  items: [aiRecord],
  page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
};

const aiRequestList: ListResponse<AiRequestRecord> = {
  items: [{
    id: "ai-request-1",
    createdAt: "2026-04-13T00:00:00.000Z",
    updatedAt: "2026-04-13T00:00:00.000Z",
    requestType: "dashboard_query",
    requestedBy: "user-1",
    inputPayload: { question: "What needs attention today?" },
    status: "completed"
  }],
  page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
};

const aiFeedbackList: ListResponse<AiFeedbackRecord> = {
  items: [{
    id: "ai-feedback-1",
    createdAt: "2026-04-13T00:00:00.000Z",
    updatedAt: "2026-04-13T00:00:00.000Z",
    responseId: "ai-response-1",
    rating: "positive",
    comment: "Useful",
    submittedBy: "user-1"
  }],
  page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
};

const promptTemplate: AiPromptTemplateRecord = {
  id: "ai-template-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  key: "dashboard.summary",
  label: "Dashboard Summary",
  promptText: "Summarize the dashboard.",
  version: 1,
  status: "active"
};

const actionDraftList: ListResponse<AiActionDraftRecord> = {
  items: [{
    id: "ai-action-draft-1",
    createdAt: "2026-04-13T00:00:00.000Z",
    updatedAt: "2026-04-13T00:00:00.000Z",
    responseId: "ai-response-1",
    resourceType: "alert",
    resourceId: "alert-1",
    title: "Inspect aeration equipment",
    body: "Inspect pond 1 aeration equipment.",
    status: "draft"
  }],
  page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
};

describe("AI contracts", () => {
  it("application service uses the AI repository port for record access", async () => {
    const repository: AiRepositoryPort = {
      create: vi.fn().mockResolvedValue(aiRecord),
      update: vi.fn().mockResolvedValue(aiRecord),
      getById: vi.fn().mockResolvedValue(aiRecord),
      list: vi.fn().mockResolvedValue(aiList),
      saveRequestRecord: vi.fn().mockResolvedValue(aiRequestList.items[0]!),
      saveResponseRecord: vi.fn().mockResolvedValue(aiRecord),
      listRequests: vi.fn().mockResolvedValue(aiRequestList),
      saveFeedbackRecord: vi.fn().mockResolvedValue(aiFeedbackList.items[0]!),
      listFeedback: vi.fn().mockResolvedValue(aiFeedbackList),
      getPromptTemplateByKey: vi.fn().mockResolvedValue(promptTemplate),
      listPromptTemplates: vi.fn().mockResolvedValue({ items: [promptTemplate], page: aiList.page }),
      saveActionDraft: vi.fn().mockResolvedValue(actionDraftList.items[0]!),
      listActionDrafts: vi.fn().mockResolvedValue(actionDraftList)
    };

    const service = new AiApplicationService(repository);
    const result = await service.getById("ai-response-1");

    expect(repository.getById).toHaveBeenCalledWith("ai-response-1");
    expect(result.data.model).toBe("gpt-placeholder");
  });

  it("controller keeps AI action routes inside the standard success envelope", async () => {
    const placeholderService = { getPlaceholder: vi.fn().mockResolvedValue({ ok: true }) };
    const appService = {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn(),
      getById: vi.fn(),
      explainAlert: vi.fn().mockResolvedValue({ ok: true, data: explainResponse })
    };

    const controller = new AiController(placeholderService as never, appService as never);
    const response = await controller.explainAlert(new ExplainAlertDto());

    expect(response.ok).toBe(true);
    expect(response.data.explanation).toContain("Placeholder");
  });

  it("mapper outputs align with shared AI response contracts", () => {
    const explain = toAiAlertsExplainResponse({
      ...explainResponse,
      explanation: "AI explanation"
    });
    const dashboard = toAiDashboardQueryResponse({
      answer: "Everything looks stable.",
      relatedMetrics: ["active_ponds"]
    });

    expect(toAiItemResponse(aiRecord).data.requestId).toBe("ai-request-1");
    expect(toAiListResponse(aiList).data.items).toHaveLength(1);
    expect(explain.data.recommendations[0]).toContain("Inspect");
    expect(dashboard.data.relatedMetrics[0]).toBe("active_ponds");

    expectTypeOf<typeof explain>().toEqualTypeOf<ApiSuccessEnvelope<AiAlertsExplainResponse>>();
    expectTypeOf<typeof dashboard>().toEqualTypeOf<ApiSuccessEnvelope<AiDashboardQueryResponse>>();
  });
});
