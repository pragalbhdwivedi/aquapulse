import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type {
  AiActionDraftRecord,
  AiAlertsExplainResponse,
  AiDashboardQueryResponse,
  AiFeedbackRecord,
  AiPromptTemplateRecord,
  AiRequestRecord,
  AiResponseRecord,
  AlertExplanationFeedbackRecord,
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
  headline: "Placeholder alert explanation",
  summary: "Placeholder AI explanation for an alert.",
  explanation: "Placeholder AI explanation for an alert.",
  recommendations: ["Inspect aeration equipment."],
  likelyCauses: [],
  likelyFactors: [],
  recommendedChecks: [],
  immediateChecks: [],
  suggestedActions: [],
  escalationConsiderations: [],
  observedFacts: [],
  confidenceNote: "Confidence is limited in this placeholder response.",
  advisoryDisclaimer:
    "Advisory only. AquaPulse will not mutate alerts from explanation output.",
  metadata: {
    mode: "fallback",
    advisoryOnly: true,
    generatedAt: "2026-04-16T00:00:00.000Z",
    modelLabel: "gpt-5-nano",
    sourceLabel: "test_placeholder",
    usedLiveOpenAi: false,
    providerPath: "deterministic_fallback",
    output: {
      outputMode: "english_only",
      primaryLanguage: "english",
      bilingual: false,
      tone: "operator"
    }
  },
  cache: {
    status: "fresh",
    cachedAt: "2026-04-16T00:00:00.000Z",
    freshness: "fresh",
    explanationVersion: "v1",
    generation: "fresh_fallback"
  }
};

const aiRecord: AiResponseRecord = {
  id: "ai-response-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  requestId: "ai-request-1",
  status: "draft",
  outputText: JSON.stringify({
    headline: "Dashboard assistant headline",
    directAnswer: "Everything looks stable.",
    metadata: {
      mode: "fallback",
      advisoryOnly: true,
      providerPath: "deterministic_fallback",
      usedLiveOpenAi: false
    }
  }),
  model: "gpt-placeholder"
};

const aiRecordProviderBacked: AiResponseRecord = {
  id: "ai-response-2",
  createdAt: "2026-04-14T00:00:00.000Z",
  updatedAt: "2026-04-14T00:00:00.000Z",
  requestId: "ai-request-2",
  status: "completed",
  outputText: JSON.stringify({
    headline: "Provider-backed answer",
    directAnswer: "North Pond 1 needs attention.",
    metadata: {
      mode: "openai_nano",
      advisoryOnly: true,
      providerPath: "openai_responses_api",
      usedLiveOpenAi: true
    }
  }),
  model: "gpt-5.4"
};

const aiList: ListResponse<AiResponseRecord> = {
  items: [aiRecord, aiRecordProviderBacked],
  page: { page: 1, pageSize: 20, totalItems: 2, totalPages: 1 }
};

const aiRequestList: ListResponse<AiRequestRecord> = {
  items: [{
    id: "ai-request-1",
    createdAt: "2026-04-13T00:00:00.000Z",
    updatedAt: "2026-04-13T00:00:00.000Z",
    requestType: "dashboard_assistant_query",
    requestedBy: "user-1",
    inputPayload: { question: "What needs attention today?" },
    status: "completed"
  },
  {
    id: "ai-request-2",
    createdAt: "2026-04-14T00:00:00.000Z",
    updatedAt: "2026-04-14T00:00:00.000Z",
    requestType: "incident_draft",
    requestedBy: "user-1",
    inputPayload: { linkedAlertId: "alert-1", linkedTaskId: "task-1" },
    status: "completed"
  }],
  page: { page: 1, pageSize: 20, totalItems: 2, totalPages: 1 }
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
      saveAlertExplanationFeedbackRecord: vi.fn(),
      listFeedback: vi.fn().mockResolvedValue(aiFeedbackList),
      getPromptTemplateByKey: vi.fn().mockResolvedValue(promptTemplate),
      listPromptTemplates: vi.fn().mockResolvedValue({ items: [promptTemplate], page: aiList.page }),
      saveActionDraft: vi.fn().mockResolvedValue(actionDraftList.items[0]!),
      listActionDrafts: vi.fn().mockResolvedValue(actionDraftList)
    };

    const service = new AiApplicationService(repository);
    const [result, history] = await Promise.all([
      service.getById("ai-response-1"),
      service.list({ page: 1, pageSize: 20, requestType: "dashboard_assistant_query" })
    ]);

    expect(repository.getById).toHaveBeenCalledWith("ai-response-1");
    expect(result.data.model).toBe("gpt-placeholder");
    expect(result.data.requestType).toBe("dashboard_assistant_query");
    expect(history.data.items[0]?.requestType).toBe("dashboard_assistant_query");
  });

  it("filters bounded AI history by provider mode and keeps compact metadata visible", async () => {
    const repository: AiRepositoryPort = {
      create: vi.fn().mockResolvedValue(aiRecord),
      update: vi.fn().mockResolvedValue(aiRecord),
      getById: vi.fn().mockResolvedValue(aiRecordProviderBacked),
      list: vi.fn().mockResolvedValue(aiList),
      saveRequestRecord: vi.fn().mockResolvedValue(aiRequestList.items[0]!),
      saveResponseRecord: vi.fn().mockResolvedValue(aiRecord),
      listRequests: vi.fn().mockResolvedValue(aiRequestList),
      saveFeedbackRecord: vi.fn().mockResolvedValue(aiFeedbackList.items[0]!),
      saveAlertExplanationFeedbackRecord: vi.fn(),
      listFeedback: vi.fn().mockResolvedValue(aiFeedbackList),
      getPromptTemplateByKey: vi.fn().mockResolvedValue(promptTemplate),
      listPromptTemplates: vi.fn().mockResolvedValue({ items: [promptTemplate], page: aiList.page }),
      saveActionDraft: vi.fn().mockResolvedValue(actionDraftList.items[0]!),
      listActionDrafts: vi.fn().mockResolvedValue(actionDraftList)
    };

    const service = new AiApplicationService(repository);
    const history = await service.list({ page: 1, pageSize: 20, providerMode: "provider_backed" });

    expect(history.data.items).toHaveLength(1);
    expect(history.data.items[0]?.providerMode).toBe("provider_backed");
    expect(history.data.items[0]?.requestType).toBe("incident_draft");
    expect(history.data.items[0]?.relatedRecordIds).toContain("alert-1");
  });

  it("controller keeps AI action routes inside the standard success envelope", async () => {
    const placeholderService = { getPlaceholder: vi.fn().mockResolvedValue({ ok: true }) };
    const feedbackRecord: AlertExplanationFeedbackRecord = {
      alertId: "alert-1",
      value: "useful",
      note: "Helpful",
      submittedAt: "2026-04-16T00:10:00.000Z",
      sourceMode: "fallback",
      generation: "fresh_fallback"
    };
    const appService = {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn(),
      getById: vi.fn(),
      explainAlert: vi.fn().mockResolvedValue({ ok: true, data: explainResponse }),
      submitAlertExplanationFeedback: vi.fn().mockResolvedValue({ ok: true, data: feedbackRecord }),
      summarizePond: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          summary: "Daily summary headline",
          highlights: ["One open issue."],
          headline: "Daily summary headline",
          keyHighlights: ["One open issue."],
          openIssues: ["High alert remains open."],
          pendingActions: ["Repeat the latest reading."],
          pondsNeedingAttention: [],
          missingDataNotes: [],
          metadata: {
            taskLabel: "daily_farm_summary",
            advisoryOnly: true,
            generatedAt: "2026-05-08T00:00:00.000Z",
            mode: "fallback",
            modelLabel: "gpt-5-nano",
            sourceLabel: "test",
            usedLiveOpenAi: false,
            providerPath: "deterministic_fallback"
          },
          audit: {
            requestId: "request-1",
            responseId: "response-1",
            requestLoggedAt: "2026-05-08T00:00:00.000Z",
            responseLoggedAt: "2026-05-08T00:00:00.000Z",
            fallbackUsed: true
          }
        }
      }),
      generateHandover: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          summary: "Shift handover headline",
          actionItems: ["Check the alert queue."],
          headline: "Shift handover headline",
          completedThisShift: [],
          pendingItems: ["Check the alert queue."],
          priorityPonds: [],
          watchItems: [],
          nextShiftNote: "Start with the alert queue.",
          metadata: {
            taskLabel: "shift_handover_generate",
            advisoryOnly: true,
            generatedAt: "2026-05-08T00:00:00.000Z",
            mode: "fallback",
            modelLabel: "gpt-5-nano",
            sourceLabel: "test",
            usedLiveOpenAi: false,
            providerPath: "deterministic_fallback"
          },
          audit: {
            requestId: "request-2",
            responseId: "response-2",
            requestLoggedAt: "2026-05-08T00:00:00.000Z",
            responseLoggedAt: "2026-05-08T00:00:00.000Z",
            fallbackUsed: true
          }
        }
      })
    };

    const controller = new AiController(placeholderService as never, appService as never);
    const [response, feedback] = await Promise.all([
      controller.explainAlert(new ExplainAlertDto()),
      controller.submitAlertExplanationFeedback({
        alertId: "alert-1",
        value: "useful",
        explanation: explainResponse
      } as never)
    ]);

    expect(response.ok).toBe(true);
    expect(response.data.explanation).toContain("Placeholder");
    expect(feedback.data.value).toBe("useful");
  });

  it("mapper outputs align with shared AI response contracts", () => {
    const explain = toAiAlertsExplainResponse({
      ...explainResponse,
      explanation: "AI explanation"
    });
    const dashboard = toAiDashboardQueryResponse({
      headline: "Dashboard assistant headline",
      directAnswer: "Everything looks stable.",
      priorityItems: [],
      supportingFacts: [],
      recommendedNextChecks: ["Check the open queue."],
      answer: "Everything looks stable.",
      relatedMetrics: ["active_ponds"],
      metadata: {
        taskLabel: "dashboard_assistant_query",
        advisoryOnly: true,
        generatedAt: "2026-05-08T00:00:00.000Z",
        mode: "fallback",
        modelLabel: "gpt-5-nano",
        sourceLabel: "test",
        usedLiveOpenAi: false,
        providerPath: "deterministic_fallback",
        output: {
          outputMode: "english_only",
          primaryLanguage: "english",
          bilingual: false,
          tone: "operator"
        }
      },
      audit: {
        requestId: "request-1",
        responseId: "response-1",
        requestLoggedAt: "2026-05-08T00:00:00.000Z",
        responseLoggedAt: "2026-05-08T00:00:00.000Z",
        fallbackUsed: true
      }
    });

    expect(toAiItemResponse(aiRecord).data.requestId).toBe("ai-request-1");
    expect(toAiListResponse(aiList).data.items).toHaveLength(2);
    expect(explain.data.recommendations[0]).toContain("Inspect");
    expect(dashboard.data.relatedMetrics[0]).toBe("active_ponds");
    expect(dashboard.data.metadata.taskLabel).toBe("dashboard_assistant_query");

    expectTypeOf<typeof explain>().toEqualTypeOf<ApiSuccessEnvelope<AiAlertsExplainResponse>>();
    expectTypeOf<typeof dashboard>().toEqualTypeOf<ApiSuccessEnvelope<AiDashboardQueryResponse>>();
  });
});
