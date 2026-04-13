import type { AiHandoverGenerateRequest, AiHandoverGenerateResponse } from "@aquapulse/types";

export class GenerateHandoverDto implements AiHandoverGenerateRequest {
  shiftDate!: string;
  pondIds?: string[];
}

export class GenerateHandoverResponseDto implements AiHandoverGenerateResponse {
  summary!: string;
  actionItems!: string[];
}
