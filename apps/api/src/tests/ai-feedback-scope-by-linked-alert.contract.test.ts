import { NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import type { AiAlertsExplainResponse } from "@aquapulse/types";
import { AiApplicationService } from "../modules/ai/application/ai.application-service";
import { InMemoryAiRepository } from "../modules/ai/repositories/in-memory-ai.repository";
import { AlertExplanationService } from "../modules/ai/services/alert-explanation.service";
import { AlertsApplicationService } from "../modules/alerts/application/alerts.application-service";
import { InMemoryAlertsRepository } from "../modules/alerts/repositories/in-memory-alerts.repository";

const liveUpdatesStub = {
  emit: () => undefined
} as const;

const explanation: AiAlertsExplainResponse = {
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
  advisoryDisclaimer: "Advisory only. AquaPulse will not mutate alerts from AI output.",
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

function createScopedAiFeedbackService() {
  const alertsService = new AlertsApplicationService(
    new InMemoryAlertsRepository(),
    liveUpdatesStub as never
  );
  const explanationService = new AlertExplanationService(alertsService);

  return new AiApplicationService(
    new InMemoryAiRepository(),
    explanationService,
    undefined,
    alertsService
  );
}

describe("AI feedback scope by linked alert visibility", () => {
  it("allows feedback for a linked alert visible to the requesting keycloak operator", async () => {
    const service = createScopedAiFeedbackService();

    const feedback = await service.submitAlertExplanationFeedback(
      {
        alertId: "alert-1",
        value: "useful",
        note: "Helpful explanation.",
        explanation
      },
      { id: "user-1", provider: "keycloak" }
    );

    expect(feedback.data.alertId).toBe("alert-1");
    expect(feedback.data.value).toBe("useful");
  });

  it("returns not found when feedback targets an out-of-scope linked alert", async () => {
    const service = createScopedAiFeedbackService();

    await expect(
      service.submitAlertExplanationFeedback(
        {
          alertId: "alert-2",
          value: "useful",
          explanation
        },
        { id: "user-1", provider: "keycloak" }
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns not found when feedback targets a missing linked alert in active auth mode", async () => {
    const service = createScopedAiFeedbackService();

    await expect(
      service.submitAlertExplanationFeedback(
        {
          alertId: "alert-missing",
          value: "useful",
          explanation
        },
        { id: "user-1", provider: "keycloak" }
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("keeps local-safe feedback broad for development flows", async () => {
    const service = createScopedAiFeedbackService();

    const feedback = await service.submitAlertExplanationFeedback(
      {
        alertId: "alert-2",
        value: "not_useful",
        note: "Local-safe broad feedback path.",
        explanation
      },
      { id: "local-operator", provider: "local" }
    );

    expect(feedback.data.alertId).toBe("alert-2");
    expect(feedback.data.value).toBe("not_useful");
  });
});
