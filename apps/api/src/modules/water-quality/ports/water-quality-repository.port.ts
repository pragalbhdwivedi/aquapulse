import type { ListResponse, WaterQualityReading } from "@aquapulse/types";
import type { CreateWaterQualityDto, QueryWaterQualityDto, UpdateWaterQualityDto } from "../dto";

export const WATER_QUALITY_REPOSITORY = Symbol("WATER_QUALITY_REPOSITORY");

export interface WaterQualityRepositoryPort {
  create(input: CreateWaterQualityDto): Promise<WaterQualityReading>;
  update(id: string, input: UpdateWaterQualityDto): Promise<WaterQualityReading>;
  getById(id: string): Promise<WaterQualityReading>;
  list(query: QueryWaterQualityDto): Promise<ListResponse<WaterQualityReading>>;
  listByPond(pondId: string): Promise<ListResponse<WaterQualityReading>>;
}
