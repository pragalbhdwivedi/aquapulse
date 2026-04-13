import type { DateRange, FilterOption, PaginationParams, SortOption } from "@aquapulse/types";

export interface AiResponseLogQueryContract extends PaginationParams {
  readonly requestId?: string;
  readonly status?: "draft" | "completed" | "rejected";
  readonly model?: string;
  readonly dateRange?: DateRange;
  readonly sort?: SortOption[];
  readonly filters?: FilterOption[];
}

export interface AiRequestLogQueryContract extends PaginationParams {
  readonly requestType?: "alerts_explain" | "ponds_summarize" | "handover_generate" | "text_rewrite" | "dashboard_query" | "incident_draft";
  readonly requestedBy?: string;
  readonly status?: "queued" | "processing" | "completed" | "failed";
  readonly dateRange?: DateRange;
  readonly sort?: SortOption[];
  readonly filters?: FilterOption[];
}

export interface AiFeedbackQueryContract extends PaginationParams {
  readonly responseId?: string;
  readonly rating?: "positive" | "negative" | "needs_review";
  readonly submittedBy?: string;
}

export interface AiPromptTemplateQueryContract extends PaginationParams {
  readonly key?: string;
  readonly status?: "draft" | "active" | "archived";
}

export interface AiActionDraftQueryContract extends PaginationParams {
  readonly responseId?: string;
  readonly resourceType?: string;
  readonly status?: "draft" | "approved" | "rejected";
}
