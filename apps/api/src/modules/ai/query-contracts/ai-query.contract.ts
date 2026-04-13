import type { RepositoryListQuery } from "@aquapulse/database";

export interface AiResponseLogQueryContract extends RepositoryListQuery {
  readonly requestId?: string;
  readonly status?: "draft" | "completed" | "rejected";
  readonly model?: string;
}

export interface AiRequestLogQueryContract extends RepositoryListQuery {
  readonly requestType?: "alerts_explain" | "ponds_summarize" | "handover_generate" | "text_rewrite" | "dashboard_query" | "incident_draft";
  readonly requestedBy?: string;
  readonly status?: "queued" | "processing" | "completed" | "failed";
}

export interface AiFeedbackQueryContract extends RepositoryListQuery {
  readonly responseId?: string;
  readonly rating?: "positive" | "negative" | "needs_review";
  readonly submittedBy?: string;
}

export interface AiPromptTemplateQueryContract extends RepositoryListQuery {
  readonly key?: string;
  readonly status?: "draft" | "active" | "archived";
}

export interface AiActionDraftQueryContract extends RepositoryListQuery {
  readonly responseId?: string;
  readonly resourceType?: string;
  readonly status?: "draft" | "approved" | "rejected";
}
