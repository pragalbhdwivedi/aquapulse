import type { WaterQualityCreateRequest } from "@aquapulse/types";

export class CreateWaterQualityDto implements WaterQualityCreateRequest {
  pondId!: string;
  recordedAt!: string;
  temperatureC?: number;
  ph?: number;
}
