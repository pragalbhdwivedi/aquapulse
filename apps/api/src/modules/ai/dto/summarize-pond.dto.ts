import type { AiPondsSummarizeRequest, AiPondsSummarizeResponse, DateRange } from "@aquapulse/types";

export class SummarizePondDto implements AiPondsSummarizeRequest {
  pondId!: string;
  dateRange?: DateRange;
}

export class SummarizePondResponseDto implements AiPondsSummarizeResponse {
  summary!: string;
  highlights!: string[];
}
