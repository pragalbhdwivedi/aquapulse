import type { AiTextRewriteRequest, AiTextRewriteResponse } from "@aquapulse/types";

export class RewriteTextDto implements AiTextRewriteRequest {
  originalText!: string;
  tone!: "operator" | "formal" | "management" | "audit";
  outputMode?: "english_only" | "bilingual";
  linkedRecordType?: "alert" | "task" | "incident";
  linkedRecordId?: string;
}

export class RewriteTextResponseDto implements AiTextRewriteResponse {
  originalText!: string;
  rewrittenEnglish!: string;
  rewrittenHindi?: string;
  tone!: "operator" | "formal" | "management" | "audit";
  clarificationNote?: string;
  missingInformationNote?: string;
  metadata!: AiTextRewriteResponse["metadata"];
  audit!: AiTextRewriteResponse["audit"];
}
