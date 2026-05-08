import type {
  AiAlertsExplainResponse,
  AlertExplanationLikelyCause,
  AiOutputTone,
  AlertExplanationMetadata,
  AlertExplanationSuggestedStep,
  AlertSummary
} from "@aquapulse/types";
import type { AlertExplanationRuntimeConfig } from "../config/alert-explanation.config";
import { buildStructuredOutputMetadata } from "./ai-output-formatting";

export interface AlertExplanationContext {
  readonly alert: AlertSummary;
  readonly includeRecommendations: boolean;
  readonly historySummary: string[];
  readonly outputMode: "english_only" | "bilingual";
  readonly tone: AiOutputTone;
}

interface OpenAiAlertExplanationClientOptions {
  readonly config: AlertExplanationRuntimeConfig;
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => string;
}

function extractTextFromResponsePayload(payload: unknown): string | undefined {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "output_text" in payload &&
    typeof (payload as { output_text?: unknown }).output_text === "string"
  ) {
    return (payload as { output_text: string }).output_text;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "output" in payload &&
    Array.isArray((payload as { output?: unknown[] }).output)
  ) {
    for (const item of (payload as { output: unknown[] }).output) {
      if (
        typeof item === "object" &&
        item !== null &&
        "content" in item &&
        Array.isArray((item as { content?: unknown[] }).content)
      ) {
        for (const contentItem of (item as { content: unknown[] }).content) {
          if (
            typeof contentItem === "object" &&
            contentItem !== null &&
            "text" in contentItem &&
            typeof (contentItem as { text?: unknown }).text === "string"
          ) {
            return (contentItem as { text: string }).text;
          }
        }
      }
    }
  }

  return undefined;
}

function normalizeCauseList(input: unknown): AlertExplanationLikelyCause[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      category:
        item.category === "water_quality" ||
        item.category === "feed" ||
        item.category === "equipment" ||
        item.category === "operator_process" ||
        item.category === "environmental"
          ? item.category
          : "unknown",
      label: typeof item.label === "string" ? item.label : "Unknown cause",
      rationale: typeof item.rationale === "string" ? item.rationale : "No rationale supplied.",
      likelihood: item.likelihood === "high" || item.likelihood === "low" ? item.likelihood : "medium"
    }));
}

function normalizeStepList(input: unknown): AlertExplanationSuggestedStep[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      title: typeof item.title === "string" ? item.title : "Suggested follow-up",
      detail: typeof item.detail === "string" ? item.detail : "No additional detail supplied.",
      priority:
        item.priority === "immediate" || item.priority === "monitor"
          ? item.priority
          : "next_round"
    }));
}

function buildMetadata(
  now: string,
  config: AlertExplanationRuntimeConfig,
  context: AlertExplanationContext
): AlertExplanationMetadata {
  return {
    advisoryOnly: true,
    generatedAt: now,
    mode: "openai_nano",
    modelLabel: config.modelLabel,
    sourceLabel: "openai_responses_api",
    usedLiveOpenAi: true,
    providerPath: "openai_responses_api",
    output: buildStructuredOutputMetadata(
      {
        outputMode: context.outputMode,
        tone: context.tone
      },
      context.tone
    )
  };
}

export class OpenAiAlertExplanationClient {
  private readonly config: AlertExplanationRuntimeConfig;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => string;

  constructor(options: OpenAiAlertExplanationClientOptions) {
    this.config = options.config;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async explain(context: AlertExplanationContext): Promise<AiAlertsExplainResponse | null> {
    if (!this.config.configured) {
      return null;
    }

    const promptPayload = {
      instruction:
        "Return JSON only. Keep the output advisory, non-destructive, and suitable for aquaculture alert triage.",
      alert: {
        id: context.alert.id,
        title: context.alert.title,
        severity: context.alert.severity,
        source: context.alert.source,
        pondId: context.alert.pondId,
        status: context.alert.status,
        assignedTo: context.alert.assignedTo,
        reviewState: context.alert.reviewState,
        reviewLabel: context.alert.reviewLabel,
        latestNote: context.alert.latestNote
      },
      historySummary: context.historySummary,
      includeRecommendations: context.includeRecommendations,
      outputMode: context.outputMode,
      tone: context.tone,
      requiredFields: [
        "headline",
        "summary",
        "explanation",
        "likelyFactors",
        "immediateChecks",
        "escalationConsiderations",
        "observedFacts",
        "likelyCauses",
        "recommendedChecks",
        "suggestedActions",
        "confidenceNote",
        "advisoryDisclaimer",
        "missingInformationNote"
      ]
    };

    const response = await this.fetchImpl(`${this.config.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.modelLabel,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "You explain operational aquaculture alerts. Stay advisory only. Do not suggest automatic state changes. Do not claim certainty."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify(promptPayload)
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI alert explanation request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as unknown;
    const rawText = extractTextFromResponsePayload(payload);
    if (!rawText) {
      throw new Error("OpenAI alert explanation response did not include a parseable text output.");
    }

    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    const recommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.filter((item): item is string => typeof item === "string")
      : [];
    const likelyCauses = normalizeCauseList(parsed.likelyCauses);
    const likelyFactors = normalizeCauseList(parsed.likelyFactors);
    const recommendedChecks = normalizeStepList(parsed.recommendedChecks);
    const immediateChecks = normalizeStepList(parsed.immediateChecks);

    return {
      headline:
        typeof parsed.headline === "string"
          ? parsed.headline
          : `${context.alert.severity.toUpperCase()} ${context.alert.source} alert: ${context.alert.title}`,
      summary:
        typeof parsed.summary === "string"
          ? parsed.summary
          : `Advisory explanation for alert ${context.alert.id}.`,
      explanation:
        typeof parsed.explanation === "string"
          ? parsed.explanation
          : `This alert may reflect a ${context.alert.source} condition that should be reviewed by an operator.`,
      explanationHindi:
        typeof parsed.explanationHindi === "string"
          ? parsed.explanationHindi
          : undefined,
      recommendations,
      likelyCauses,
      likelyFactors: likelyFactors.length > 0 ? likelyFactors : likelyCauses,
      recommendedChecks,
      immediateChecks: immediateChecks.length > 0 ? immediateChecks : recommendedChecks,
      suggestedActions: normalizeStepList(parsed.suggestedActions),
      escalationConsiderations: Array.isArray(parsed.escalationConsiderations)
        ? parsed.escalationConsiderations.filter((item): item is string => typeof item === "string")
        : [],
      observedFacts: Array.isArray(parsed.observedFacts)
        ? parsed.observedFacts.filter((item): item is string => typeof item === "string")
        : [],
      confidenceNote:
        typeof parsed.confidenceNote === "string"
          ? parsed.confidenceNote
          : "Confidence is limited because this advisory explanation only sees the current alert context.",
      advisoryDisclaimer:
        typeof parsed.advisoryDisclaimer === "string"
          ? parsed.advisoryDisclaimer
          : "Advisory only. Review the alert in context before taking any operational action.",
      missingInformationNote:
        typeof parsed.missingInformationNote === "string"
          ? parsed.missingInformationNote
          : undefined,
      metadata: buildMetadata(this.now(), this.config, context),
      cache: {
        status: "fresh",
        cachedAt: this.now(),
        freshness: "fresh",
        explanationVersion: "v1",
        generation: "fresh_openai_nano"
      }
    };
  }
}
