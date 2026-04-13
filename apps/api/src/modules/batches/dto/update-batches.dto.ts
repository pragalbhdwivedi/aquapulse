export class UpdateBatchDto {
  name?: string;
  lifecycleStage?: "planned" | "stocked" | "growing" | "harvested";
}
