import { Injectable } from "@nestjs/common";
import type {
  AiAlertsExplainRequest,
  AiAlertsExplainResponse,
  AlertExplanationLikelyCause,
  AlertExplanationMetadata,
  AlertExplanationSuggestedStep,
  AlertSummary
} from "@aquapulse/types";
import { AlertsApplicationService } from "../../alerts/application/alerts.application-service";
import {
  readAlertExplanationRuntimeConfig,
  type AlertExplanationRuntimeConfig
} from "../config/alert-explanation.config";
import {
  OpenAiAlertExplanationClient,
  type AlertExplanationContext
} from "./openai-alert-explanation.client";

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
  usedLiveOpenAi: boolean
): AlertExplanationMetadata {
  return {
    advisoryOnly: true,
    generatedAt: now,
    mode: usedLiveOpenAi ? "openai_nano" : "fallback",
    modelLabel: config.modelLabel,
    sourceLabel: usedLiveOpenAi ? "openai_responses_api" : "deterministic_fallback",
    usedLiveOpenAi
  };
}

function buildFallbackExplanation(
  alert: AlertSummary,
  config: AlertExplanationRuntimeConfig,
  now: string,
  includeRecommendations: boolean
): AiAlertsExplainResponse {
  const likelyCauses = buildLikelyCauses(alert);
  const recommendedChecks = buildRecommendedChecks(alert);
  const suggestedActions = includeRecommendations ? buildSuggestedActions(alert) : [];
  const summary = `Alert "${alert.title}" likely reflects a ${alert.source} condition that should be manually reviewed before any queue action is taken.`;
  const explanation = `${summary} Current state: ${alert.status}, severity: ${alert.severity}, review state: ${alert.reviewState ?? "unreviewed"}.`;
  const recommendations = [...recommendedChecks, ...suggestedActions]
    .slice(0, 4)
    .map((item) => item.title);

  return {
    summary,
    explanation,
    recommendations,
    likelyCauses,
    recommendedChecks,
    suggestedActions,
    confidenceNote:
      "This explanation is generated from the alert context only. It should be treated as advisory guidance, not as proof of the root cause.",
    advisoryDisclaimer:
      "Advisory only. AquaPulse will not acknowledge, resolve, assign, or otherwise mutate alerts from AI output.",
    metadata: buildMetadata(now, config, false)
  };
}

@Injectable()
export class AlertExplanationService {
  private readonly config: AlertExplanationRuntimeConfig;
  private readonly openAiClient: OpenAiAlertExplanationClient;
  private readonly now: () => string;

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
      warnings: this.config.warnings
    };
  }

  async explainAlert(input: AiAlertsExplainRequest): Promise<AiAlertsExplainResponse> {
    const alert = (await this.alertsApplicationService.getById(input.alertId)).data;
    const includeRecommendations = input.includeRecommendations ?? true;
    const context: AlertExplanationContext = {
      alert,
      includeRecommendations,
      historySummary: buildHistorySummary(alert)
    };

    if (this.config.mode === "openai" && this.config.configured) {
      try {
        const response = await this.openAiClient.explain(context);
        if (response) {
          return response;
        }
      } catch {
        // Intentionally fall back to the deterministic advisory path.
      }
    }

    return buildFallbackExplanation(alert, this.config, this.now(), includeRecommendations);
  }
}
