import type { AiDashboardQueryRequest, AiDashboardQueryResponse, DateRange } from "@aquapulse/types";

export class DashboardQueryDto implements AiDashboardQueryRequest {
  question!: string;
  pondId?: string;
  dateRange?: DateRange;
  tone?: "operator" | "formal" | "management" | "audit";
  outputMode?: "english_only" | "bilingual";
}

export class DashboardQueryResponseDto implements AiDashboardQueryResponse {
  headline!: string;
  headlineHindi?: string;
  directAnswer!: string;
  directAnswerHindi?: string;
  priorityItems!: AiDashboardQueryResponse["priorityItems"];
  supportingFacts!: AiDashboardQueryResponse["supportingFacts"];
  recommendedNextChecks!: string[];
  missingInformationNote?: string;
  answer!: string;
  relatedMetrics!: string[];
  metadata!: AiDashboardQueryResponse["metadata"];
  audit!: AiDashboardQueryResponse["audit"];
}
