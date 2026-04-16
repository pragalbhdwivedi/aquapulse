import type { AiAlertsExplainRequest, AiAlertsExplainResponse } from "@aquapulse/types";

export class ExplainAlertDto implements AiAlertsExplainRequest { alertId!: string; includeRecommendations?: boolean; }
export class ExplainAlertResponseDto implements AiAlertsExplainResponse {
  explanation!: string;
  recommendations!: string[];
  summary!: string;
  likelyCauses!: AiAlertsExplainResponse["likelyCauses"];
  recommendedChecks!: AiAlertsExplainResponse["recommendedChecks"];
  suggestedActions!: AiAlertsExplainResponse["suggestedActions"];
  confidenceNote!: string;
  advisoryDisclaimer!: string;
  metadata!: AiAlertsExplainResponse["metadata"];
  cache!: AiAlertsExplainResponse["cache"];
}
