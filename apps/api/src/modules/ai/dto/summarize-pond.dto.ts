import type { AiPondsSummarizeRequest, AiPondsSummarizeResponse, DateRange } from "@aquapulse/types";

export class SummarizePondDto implements AiPondsSummarizeRequest {
  pondId?: string;
  farmId?: string;
  generatedForDate?: string;
  dateRange?: DateRange;
  includeMissingDataSignals?: boolean;
}
export class SummarizePondResponseDto implements AiPondsSummarizeResponse {
  summary!: string;
  highlights!: string[];
  headline!: string;
  keyHighlights!: string[];
  openIssues!: string[];
  pendingActions!: string[];
  pondsNeedingAttention!: AiPondsSummarizeResponse["pondsNeedingAttention"];
  missingDataNotes!: string[];
  metadata!: AiPondsSummarizeResponse["metadata"];
  audit!: AiPondsSummarizeResponse["audit"];
}
