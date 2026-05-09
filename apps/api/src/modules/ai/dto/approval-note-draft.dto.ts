import type {
  AiApprovalNoteDraftRequest,
  AiApprovalNoteDraftResponse
} from "@aquapulse/types";

export class ApprovalNoteDraftDto implements AiApprovalNoteDraftRequest {
  recordType!: "alert" | "task" | "incident";
  recordId?: string;
  mode!: "closure_note" | "escalation_justification" | "needs_review" | "pending_verification";
  promptNote?: string;
  outputMode?: "english_only" | "bilingual";
  tone?: "operator" | "formal" | "management" | "audit";
}

export class ApprovalNoteDraftResponseDto implements AiApprovalNoteDraftResponse {
  headline!: string;
  draftNote!: string;
  draftNoteHindi?: string;
  rationaleSummary!: string;
  suggestedNextChecks!: string[];
  reviewRequired!: boolean;
  missingInformationNote?: string;
  metadata!: AiApprovalNoteDraftResponse["metadata"];
  audit!: AiApprovalNoteDraftResponse["audit"];
}
