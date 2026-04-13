import type { AiAlertsExplainRequest, AiAlertsExplainResponse } from "@aquapulse/types";

export class ExplainAlertDto implements AiAlertsExplainRequest {
  alertId!: string;
  includeRecommendations?: boolean;
}

export class ExplainAlertResponseDto implements AiAlertsExplainResponse {
  explanation!: string;
  recommendations!: string[];
}
