import type { AiHandoverGenerateRequest, AiHandoverGenerateResponse } from "@aquapulse/types";

export class GenerateHandoverDto implements AiHandoverGenerateRequest {
  shiftDate!: string;
  pondIds?: string[];
  shiftLabel?: string;
  includeCompletedItems?: boolean;
}
export class GenerateHandoverResponseDto implements AiHandoverGenerateResponse {
  summary!: string;
  actionItems!: string[];
  headline!: string;
  completedThisShift!: string[];
  pendingItems!: string[];
  priorityPonds!: AiHandoverGenerateResponse["priorityPonds"];
  watchItems!: string[];
  nextShiftNote!: string;
  metadata!: AiHandoverGenerateResponse["metadata"];
  audit!: AiHandoverGenerateResponse["audit"];
}
