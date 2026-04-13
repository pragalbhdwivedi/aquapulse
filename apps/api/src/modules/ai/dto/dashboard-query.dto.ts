import type { AiDashboardQueryRequest, AiDashboardQueryResponse, DateRange } from "@aquapulse/types";

export class DashboardQueryDto implements AiDashboardQueryRequest {
  question!: string;
  dateRange?: DateRange;
}

export class DashboardQueryResponseDto implements AiDashboardQueryResponse {
  answer!: string;
  relatedMetrics!: string[];
}
