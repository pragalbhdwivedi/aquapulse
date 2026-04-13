export class CreateWaterQualityDto {
  pondId!: string;
  recordedAt!: string;
  temperatureC?: number;
  ph?: number;
}
