import type { AiResponseLogListQueryRequest, ListQueryRequest } from "@aquapulse/types";

export interface AiResponseLogQueryContract extends AiResponseLogListQueryRequest {
  readonly requestedBy?: string;
}

export interface AiRequestLogQueryContract extends ListQueryRequest {
  readonly requestType?:
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
  readonly requestedBy?: string;
  readonly status?: "queued" | "processing" | "completed" | "failed";
}

export interface AiFeedbackQueryContract extends ListQueryRequest {
  readonly responseId?: string;
  readonly rating?: "positive" | "negative" | "needs_review";
  readonly submittedBy?: string;
}

export interface AiPromptTemplateQueryContract extends ListQueryRequest {
  readonly key?: string;
  readonly status?: "draft" | "active" | "archived";
}

export interface AiActionDraftQueryContract extends ListQueryRequest {
  readonly responseId?: string;
  readonly resourceType?: string;
  readonly status?: "draft" | "approved" | "rejected";
}
