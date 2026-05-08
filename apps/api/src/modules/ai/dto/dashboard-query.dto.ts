import type { AiDashboardQueryRequest, AiDashboardQueryResponse, DateRange } from "@aquapulse/types";

export class DashboardQueryDto implements AiDashboardQueryRequest {
  question!: string;
  pondId?: string;
  dateRange?: DateRange;
}

export class DashboardQueryResponseDto implements AiDashboardQueryResponse {
  headline!: string;
  directAnswer!: string;
  priorityItems!: AiDashboardQueryResponse["priorityItems"];
  supportingFacts!: AiDashboardQueryResponse["supportingFacts"];
  recommendedNextChecks!: string[];
  missingInformationNote?: string;
  answer!: string;
  relatedMetrics!: string[];
  metadata!: AiDashboardQueryResponse["metadata"];
  audit!: AiDashboardQueryResponse["audit"];
}
