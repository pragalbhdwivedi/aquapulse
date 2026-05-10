import type {
  AiAlertsExplainResponse,
  AlertExplanationFeedbackRecord,
  ApiSuccessEnvelope
} from "@aquapulse/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRepositoriesFromConfig } from "../repositories";
import { resetAlertsMockState } from "../mocks/adapters";

function jsonResponse<TBody>(body: TBody) {
  return {
    status: 200,
    async json() {
      return body;
    }
  } as Response;
}

const explanationWithLinkage: AiAlertsExplainResponse = {
  aiResponseId: "ai-response-alert-1",
  headline: "High alert explanation",
  summary: "Alert alert-1 likely reflects an operational condition that still needs a manual check.",
  explanation: "Placeholder explanation for the current alert.",
  recommendations: ["Inspect aeration equipment.", "Repeat the reading."],
  likelyCauses: [],
  likelyFactors: [],
  recommendedChecks: [],
  immediateChecks: [],
  suggestedActions: [],
  escalationConsiderations: [],
  observedFacts: [],
  confidenceNote: "Confidence is limited because this is a placeholder explanation.",
  advisoryDisclaimer:
    "Advisory only. This explanation does not acknowledge, resolve, assign, or mutate alerts.",
  metadata: {
    mode: "fallback",
    advisoryOnly: true,
    generatedAt: "2026-04-16T09:00:00.000Z",
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
    cachedAt: "2026-04-16T09:00:00.000Z",
    freshness: "fresh",
    explanationVersion: "v1",
    generation: "fresh_fallback"
  }
};

describe("AI response linkage frontend adoption", () => {
  beforeEach(() => {
    resetAlertsMockState();
  });

  it("preserves aiResponseId from explanation responses and forwards it as a top-level feedback field", async () => {
    const requests: Array<{ url: string; body?: unknown }> = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
      requests.push({ url, body });

      if (url.includes("/api/ai/alerts/explain/feedback")) {
        return jsonResponse<ApiSuccessEnvelope<AlertExplanationFeedbackRecord>>({
          ok: true,
          data: {
            alertId: "alert-1",
            value: "useful",
            note: "Helpful starting point",
            submittedAt: "2026-04-16T09:15:00.000Z",
            sourceMode: "fallback",
            generation: "fresh_fallback"
          }
        });
      }

      if (url.includes("/api/ai/alerts/explain")) {
        return jsonResponse<ApiSuccessEnvelope<AiAlertsExplainResponse>>({
          ok: true,
          data: explanationWithLinkage
        });
      }

      throw new Error(`Unhandled fetch request: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const repositories = createRepositoriesFromConfig({
      mode: "mock",
      enablePlaceholderHttp: false,
      enableFetchHttp: true,
      alertsMode: "http"
    });

    const explanation = await repositories.alerts.explain({
      alertId: "alert-1",
      includeRecommendations: true,
      reuseCached: false
    });
    await repositories.alerts.submitExplanationFeedback({
      alertId: "alert-1",
      aiResponseId: explanation.data.aiResponseId,
      value: "useful",
      note: "Helpful starting point",
      explanation: explanation.data
    });

    const feedbackRequest = requests.find((request) =>
      request.url.includes("/api/ai/alerts/explain/feedback")
    );

    expect(explanation.data.aiResponseId).toBe("ai-response-alert-1");
    expect(feedbackRequest?.body).toMatchObject({
      alertId: "alert-1",
      aiResponseId: "ai-response-alert-1",
      value: "useful"
    });
  });

  it("keeps feedback submissions compatible when aiResponseId is unavailable", async () => {
    const repositories = createRepositoriesFromConfig({
      mode: "mock",
      enablePlaceholderHttp: false,
      enableFetchHttp: false,
      alertsMode: "inherit"
    });

    const explanation = await repositories.alerts.explain({
      alertId: "alert-1",
      includeRecommendations: true
    });
    const feedback = await repositories.alerts.submitExplanationFeedback({
      alertId: "alert-1",
      aiResponseId: explanation.data.aiResponseId,
      value: "useful",
      explanation: explanation.data
    });

    expect(explanation.data.aiResponseId).toBeUndefined();
    expect(feedback.data.value).toBe("useful");
  });
});
