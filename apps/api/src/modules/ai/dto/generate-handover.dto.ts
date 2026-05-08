import type { AiHandoverGenerateRequest, AiHandoverGenerateResponse } from "@aquapulse/types";

export class GenerateHandoverDto implements AiHandoverGenerateRequest {
  shiftDate!: string;
  pondIds?: string[];
  shiftLabel?: string;
  includeCompletedItems?: boolean;
  tone?: "operator" | "formal" | "management" | "audit";
  outputMode?: "english_only" | "bilingual";
}
export class GenerateHandoverResponseDto implements AiHandoverGenerateResponse {
  summary!: string;
  summaryHindi?: string;
  actionItems!: string[];
  headline!: string;
  headlineHindi?: string;
  completedThisShift!: string[];
  pendingItems!: string[];
  priorityPonds!: AiHandoverGenerateResponse["priorityPonds"];
  watchItems!: string[];
  nextShiftNote!: string;
  nextShiftNoteHindi?: string;
  metadata!: AiHandoverGenerateResponse["metadata"];
  audit!: AiHandoverGenerateResponse["audit"];
}
