import type { AiIncidentsDraftRequest, AiIncidentsDraftResponse } from "@aquapulse/types";

export class DraftIncidentDto implements AiIncidentsDraftRequest {
  rawOperatorNotes!: string;
  linkedAlertId?: string;
  linkedTaskId?: string;
  linkedPondId?: string;
  severity?: "low" | "medium" | "high" | "critical";
  urgencyHint?: "low" | "medium" | "high";
  categoryHint?: string;
  outputMode?: "english_only" | "bilingual";
  tone?: "operator" | "formal" | "management" | "audit";
}

export class DraftIncidentResponseDto implements AiIncidentsDraftResponse {
  headline!: string;
  incidentSummary!: string;
  keyFacts!: string[];
  likelyImpact!: string;
  immediateActionsSuggested!: string[];
  escalationNeed!: string;
  draftEnglish!: string;
  draftHindi?: string;
  missingInformationNote?: string;
  metadata!: AiIncidentsDraftResponse["metadata"];
  audit!: AiIncidentsDraftResponse["audit"];
}
