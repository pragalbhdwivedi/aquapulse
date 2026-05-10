import type { AiAlertsExplainRequest, AiAlertsExplainResponse } from "@aquapulse/types";

export class ExplainAlertDto implements AiAlertsExplainRequest {
  alertId!: string;
  includeRecommendations?: boolean;
  reuseCached?: boolean;
  tone?: "operator" | "formal" | "management" | "audit";
  outputMode?: "english_only" | "bilingual";
}
export class ExplainAlertResponseDto implements AiAlertsExplainResponse {
  aiResponseId?: string;
  headline!: string;
  explanation!: string;
  explanationHindi?: string;
  recommendations!: string[];
  summary!: string;
  likelyCauses!: AiAlertsExplainResponse["likelyCauses"];
  likelyFactors!: AiAlertsExplainResponse["likelyFactors"];
  recommendedChecks!: AiAlertsExplainResponse["recommendedChecks"];
  immediateChecks!: AiAlertsExplainResponse["immediateChecks"];
  suggestedActions!: AiAlertsExplainResponse["suggestedActions"];
  escalationConsiderations!: string[];
  observedFacts!: string[];
  confidenceNote!: string;
  advisoryDisclaimer!: string;
  missingInformationNote?: string;
  metadata!: AiAlertsExplainResponse["metadata"];
  cache!: AiAlertsExplainResponse["cache"];
  feedbackSummary?: AiAlertsExplainResponse["feedbackSummary"];
}
