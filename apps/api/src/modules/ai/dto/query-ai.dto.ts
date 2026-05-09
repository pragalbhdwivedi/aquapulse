import type { AiResponseLogQueryContract } from "../query-contracts/ai-query.contract";
import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryAiDto extends QueryFilterBaseDto implements AiResponseLogQueryContract {
  requestId?: string;
  status?: "draft" | "completed" | "rejected";
  model?: string;
  requestType?:
    | "alerts_explain"
    | "ponds_summarize"
    | "handover_generate"
    | "text_rewrite"
    | "incident_rewrite"
    | "dashboard_query"
    | "dashboard_assistant_query"
    | "approval_note_draft"
    | "incident_draft"
    | "daily_farm_summary"
    | "shift_handover_generate";
  providerMode?: "fallback" | "provider_backed";
  createdAfter?: string;
  createdBefore?: string;
  relatedRecordId?: string;
}
