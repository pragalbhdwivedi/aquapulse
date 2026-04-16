import { afterEach, describe, expect, it, vi } from "vitest";
import type { AlertSummary } from "@aquapulse/types";
import { readAlertExplanationRuntimeConfig } from "../config/alert-explanation.config";
import { AlertExplanationService } from "../services/alert-explanation.service";

const alert: AlertSummary = {
  id: "alert-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-16T09:00:00.000Z",
  title: "Low dissolved oxygen warning",
  severity: "high",
  source: "water-quality",
  pondId: "pond-1",
  status: "open",
  reviewState: "under_review",
  latestNote: "Dissolved oxygen dropped below the expected range.",
  actionHistory: [
    {
      action: "created",
      timestamp: "2026-04-13T00:00:00.000Z"
    }
  ]
};

describe("Alert explanation service", () => {
  afterEach(() => {
    delete process.env.AQUAPULSE_AI_ALERT_EXPLANATIONS_MODE;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_ALERT_EXPLANATIONS_MODEL;
    vi.unstubAllGlobals();
  });

  it("keeps OpenAI mode config-safe when credentials are missing", () => {
    const config = readAlertExplanationRuntimeConfig({
      AQUAPULSE_AI_ALERT_EXPLANATIONS_MODE: "openai"
    });

    expect(config.mode).toBe("openai");
    expect(config.configured).toBe(false);
    expect(config.warnings.map((warning) => warning.code)).toContain("OPENAI_API_KEY_MISSING");
  });

  it("returns a deterministic advisory fallback explanation without OpenAI access", async () => {
    const service = new AlertExplanationService({
      getById: vi.fn().mockResolvedValue({ ok: true, data: alert })
    } as never);

    const response = await service.explainAlert({
      alertId: "alert-1",
      includeRecommendations: true
    });

    expect(response.metadata.mode).toBe("fallback");
    expect(response.metadata.usedLiveOpenAi).toBe(false);
    expect(response.advisoryDisclaimer).toContain("Advisory only");
    expect(response.suggestedActions.length).toBeGreaterThan(0);
  });

  it("falls back safely when OpenAI mode is enabled but the backend call fails", async () => {
    process.env.AQUAPULSE_AI_ALERT_EXPLANATIONS_MODE = "openai";
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("connect ECONNREFUSED");
    }));

    const service = new AlertExplanationService({
      getById: vi.fn().mockResolvedValue({ ok: true, data: alert })
    } as never);
    const response = await service.explainAlert({
      alertId: "alert-1"
    });

    expect(response.metadata.mode).toBe("fallback");
    expect(response.explanation).toContain("manually reviewed");
    expect(response.recommendations.length).toBeGreaterThan(0);
  });
});
