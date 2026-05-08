import { Injectable } from "@nestjs/common";
import type {
  AiAlertsExplainRequest,
  AiAlertsExplainResponse,
  AlertExplanationFeedbackRecord,
  AlertExplanationFeedbackRequest,
  AlertExplanationLikelyCause,
  AlertExplanationMetadata,
  AlertExplanationSuggestedStep,
  AlertSummary
} from "@aquapulse/types";
import { aiAlertExplanationResponseSchema } from "@aquapulse/validation";
import { AlertsApplicationService } from "../../alerts/application/alerts.application-service";
import {
  readAlertExplanationRuntimeConfig,
  type AlertExplanationRuntimeConfig
} from "../config/alert-explanation.config";
import {
  OpenAiAlertExplanationClient,
  type AlertExplanationContext
} from "./openai-alert-explanation.client";
import {
  buildStructuredOutputMetadata,
  prefixToneLabel,
  withOptionalHindi
} from "./ai-output-formatting";

function buildHistorySummary(alert: AlertSummary): string[] {
  return (alert.actionHistory ?? [])
    .slice(-4)
    .map((item) => {
      const notePart = item.note ? ` with note "${item.note}"` : "";
      return `${item.action} at ${item.timestamp}${notePart}`;
    });
}

function buildLikelyCauses(alert: AlertSummary): AlertExplanationLikelyCause[] {
  if (alert.source === "water-quality") {
    return [
      {
        category: "water_quality",
        label: "Out-of-range water parameter",
        rationale:
          "The alert source is water-quality, so a threshold breach or missing critical reading is the most likely trigger.",
        likelihood: alert.severity === "critical" ? "high" : "medium"
      },
      {
        category: "equipment",
        label: "Aeration or sensor issue",
        rationale:
          "Water-quality alerts often coincide with aeration interruptions, faulty probes, or stale readings that should be rechecked.",
        likelihood: "medium"
      }
    ];
  }

  if (alert.source === "feed") {
    return [
      {
        category: "feed",
        label: "Feed quantity anomaly",
        rationale:
          "The alert source is feed, so the first review should focus on the planned versus recorded feed quantity and timing.",
        likelihood: "high"
      },
      {
        category: "operator_process",
        label: "Logging or schedule mismatch",
        rationale:
          "Feed alerts can also reflect duplicated entries, late entries, or a mismatch between the actual run and the recorded run.",
        likelihood: "medium"
      }
    ];
  }

  return [
    {
      category: "unknown",
      label: "General operational anomaly",
      rationale:
        "The current alert context does not point to a single operational cause, so the alert should be reviewed against the latest notes and history.",
      likelihood: "medium"
    }
  ];
}

function buildRecommendedChecks(alert: AlertSummary): AlertExplanationSuggestedStep[] {
  const baseChecks: AlertExplanationSuggestedStep[] = [
    {
      title: "Review the latest operator note",
      detail:
        alert.latestNote?.trim()
          ? `Latest note: ${alert.latestNote}`
          : "No latest note is present, so confirm what triggered the alert with the operator or the originating workflow.",
      priority: "immediate"
    },
    {
      title: "Confirm the alert is still current",
      detail:
        "Check whether the triggering condition is still present before taking any lifecycle action on the alert.",
      priority: "immediate"
    }
  ];

  if (alert.source === "water-quality") {
    baseChecks.push({
      title: "Repeat the water-quality reading",
      detail:
        "Retake the critical measurement and verify sensor/aeration conditions before concluding that the alert reflects a persistent issue.",
      priority: "immediate"
    });
  }

  if (alert.source === "feed") {
    baseChecks.push({
      title: "Compare planned vs recorded feed quantity",
      detail:
        "Review the feed run, schedule, and entry timing to determine whether the anomaly is operational or just a logging mismatch.",
      priority: "next_round"
    });
  }

  return baseChecks;
}

function buildSuggestedActions(alert: AlertSummary): AlertExplanationSuggestedStep[] {
  return [
    {
      title: "Document the next manual check",
      detail:
        "Use the alert note/review flow to record what was verified so later operators can see the reasoning.",
      priority: "immediate"
    },
    {
      title: "Escalate if severity remains high",
      detail:
        alert.severity === "critical" || alert.severity === "high"
          ? "If the condition persists after rechecking, escalate to a supervisor or farm lead."
          : "Escalate if rechecks or new notes indicate the condition is worsening.",
      priority: "next_round"
    }
  ];
}

function buildMetadata(
  now: string,
  config: AlertExplanationRuntimeConfig,
  usedLiveOpenAi: boolean,
  input: AiAlertsExplainRequest
): AlertExplanationMetadata {
  return {
    advisoryOnly: true,
    generatedAt: now,
    mode: usedLiveOpenAi ? "openai_nano" : "fallback",
    modelLabel: config.modelLabel,
    sourceLabel: usedLiveOpenAi ? "openai_responses_api" : "deterministic_fallback",
    usedLiveOpenAi,
    providerPath: usedLiveOpenAi ? "openai_responses_api" : "deterministic_fallback",
    output: buildStructuredOutputMetadata(input, input.tone ?? "operator")
  };
}

function buildCacheKey(input: AiAlertsExplainRequest): string {
  return [
    input.alertId,
    input.includeRecommendations === false ? "without-recommendations" : "with-recommendations",
    input.outputMode ?? "english_only",
    input.tone ?? "operator"
  ].join(":");
}

function toFreshCachedResponse(response: AiAlertsExplainResponse): AiAlertsExplainResponse {
  return {
    ...response,
    cache: {
      status: "fresh",
      cachedAt: response.metadata.generatedAt,
      freshness: "fresh",
      explanationVersion: "v1",
      generation: response.metadata.mode === "openai_nano" ? "fresh_openai_nano" : "fresh_fallback"
    }
  };
}

function toReusedCachedResponse(response: AiAlertsExplainResponse): AiAlertsExplainResponse {
  return {
    ...response,
    cache: {
      ...response.cache,
      status: "reused",
      generation: "cached_reuse"
    }
  };
}

function withFeedbackSummary(
  response: AiAlertsExplainResponse,
  feedback: AlertExplanationFeedbackRecord | undefined
): AiAlertsExplainResponse {
  return {
    ...response,
    feedbackSummary: feedback
      ? {
          latest: feedback
        }
      : undefined
  };
}

function buildFallbackExplanation(
  input: AiAlertsExplainRequest,
  alert: AlertSummary,
  config: AlertExplanationRuntimeConfig,
  now: string,
  includeRecommendations: boolean
): AiAlertsExplainResponse {
  const likelyCauses = buildLikelyCauses(alert);
  const recommendedChecks = buildRecommendedChecks(alert);
  const suggestedActions = includeRecommendations ? buildSuggestedActions(alert) : [];
  const headline = `${alert.severity.toUpperCase()} ${alert.source} alert: ${alert.title}`;
  const summaryCore = `Alert "${alert.title}" likely reflects a ${alert.source} condition that should be manually reviewed before any queue action is taken.`;
  const summary = prefixToneLabel(summaryCore, input.tone ?? "operator");
  const explanation = `${summary} Current state: ${alert.status}, severity: ${alert.severity}, review state: ${alert.reviewState ?? "unreviewed"}.`;
  const observedFacts = [
    `Alert source: ${alert.source}.`,
    `Alert severity: ${alert.severity}.`,
    `Alert status: ${alert.status}.`,
    alert.latestNote?.trim() ? `Latest operator note: ${alert.latestNote}.` : "No latest operator note is attached yet."
  ];
  const escalationConsiderations = [
    alert.severity === "critical" || alert.severity === "high"
      ? "Escalate quickly if the condition remains after a fresh manual recheck."
      : "Escalate if repeat checks or new notes show the condition is worsening.",
    "Do not treat this explanation as approval to close or mutate the alert lifecycle automatically."
  ];
  const recommendations = [...recommendedChecks, ...suggestedActions]
    .slice(0, 4)
    .map((item) => item.title);
  const missingInformationNote =
    !alert.latestNote?.trim() || (alert.actionHistory?.length ?? 0) === 0
      ? "Alert context is incomplete, so the explanation should be paired with a fresh manual review and updated operator note."
      : undefined;

  return aiAlertExplanationResponseSchema.parse({
    headline,
    summary,
    explanation,
    explanationHindi: withOptionalHindi(explanation, input),
    recommendations,
    likelyCauses,
    likelyFactors: likelyCauses,
    recommendedChecks,
    immediateChecks: recommendedChecks,
    suggestedActions,
    escalationConsiderations,
    observedFacts,
    confidenceNote:
      "This explanation is generated from the alert context only. It should be treated as advisory guidance, not as proof of the root cause.",
    advisoryDisclaimer:
      "Advisory only. AquaPulse will not acknowledge, resolve, assign, or otherwise mutate alerts from AI output.",
    missingInformationNote,
    metadata: buildMetadata(now, config, false, input),
    cache: {
      status: "fresh",
      cachedAt: now,
      freshness: "fresh",
      explanationVersion: "v1",
      generation: "fresh_fallback"
    }
  });
}

@Injectable()
export class AlertExplanationService {
  private readonly config: AlertExplanationRuntimeConfig;
  private readonly openAiClient: OpenAiAlertExplanationClient;
  private readonly now: () => string;
  private readonly explanationCache = new Map<string, AiAlertsExplainResponse>();
  private readonly feedbackStore = new Map<string, AlertExplanationFeedbackRecord>();

  constructor(
    private readonly alertsApplicationService: AlertsApplicationService
  ) {
    this.config = readAlertExplanationRuntimeConfig();
    this.openAiClient = new OpenAiAlertExplanationClient({
      config: this.config
    });
    this.now = () => new Date().toISOString();
  }

  getRuntimeSummary() {
    return {
      advisoryOnly: true as const,
      mode: this.config.configured ? "openai_nano" as const : "fallback" as const,
      configured: this.config.configured,
      modelLabel: this.config.modelLabel,
      providerPath: this.config.configured ? "openai_responses_api" as const : "deterministic_fallback" as const,
      cacheEnabled: true,
      attachmentAvailable: true,
      feedbackEnabled: true,
      supportedOutputModes: ["english_only", "bilingual"] as const,
      supportedToneModes: ["operator", "formal", "management", "audit"] as const,
      warnings: this.config.warnings
    };
  }

  async submitFeedback(
    input: AlertExplanationFeedbackRequest
  ): Promise<AlertExplanationFeedbackRecord> {
    const record: AlertExplanationFeedbackRecord = {
      alertId: input.alertId,
      value: input.value,
      note: input.note?.trim() || undefined,
      submittedAt: this.now(),
      generation: input.explanation.cache.generation,
      sourceMode: input.explanation.metadata.mode
    };
    this.feedbackStore.set(input.alertId, record);
    return record;
  }

  async explainAlert(input: AiAlertsExplainRequest): Promise<AiAlertsExplainResponse> {
    const cacheKey = buildCacheKey(input);
    const shouldReuseCached = input.reuseCached !== false;
    const cached = shouldReuseCached ? this.explanationCache.get(cacheKey) : undefined;
    const latestFeedback = this.feedbackStore.get(input.alertId);

    if (cached) {
      return withFeedbackSummary(toReusedCachedResponse(cached), latestFeedback);
    }

    const alert = (await this.alertsApplicationService.getById(input.alertId)).data;
    const includeRecommendations = input.includeRecommendations ?? true;
    const context: AlertExplanationContext = {
      alert,
      includeRecommendations,
      historySummary: buildHistorySummary(alert),
      outputMode: input.outputMode ?? "english_only",
      tone: input.tone ?? "operator"
    };

    if (this.config.mode === "openai" && this.config.configured) {
      try {
        const response = await this.openAiClient.explain(context);
        if (response) {
          const freshResponse = toFreshCachedResponse(aiAlertExplanationResponseSchema.parse(response));
          this.explanationCache.set(cacheKey, freshResponse);
          return withFeedbackSummary(freshResponse, latestFeedback);
        }
      } catch {
        // Intentionally fall back to the deterministic advisory path.
      }
    }

    const fallbackResponse = buildFallbackExplanation(input, alert, this.config, this.now(), includeRecommendations);
    this.explanationCache.set(cacheKey, fallbackResponse);
    return withFeedbackSummary(fallbackResponse, latestFeedback);
  }
}
