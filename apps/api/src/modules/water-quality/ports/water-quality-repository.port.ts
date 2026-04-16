import type {
  ListResponse,
  WaterQualityCreateRequest,
  WaterQualityReading
} from "@aquapulse/types";
import type { CreateWaterQualityDto, UpdateWaterQualityDto } from "../dto";
import type { WaterQualityListQueryContract } from "../query-contracts/water-quality-query.contract";

export const WATER_QUALITY_REPOSITORY = Symbol("WATER_QUALITY_REPOSITORY");

export interface WaterQualityRepositoryPort {
  create(input: WaterQualityCreateRequest): Promise<WaterQualityReading>;
  update(id: string, input: UpdateWaterQualityDto): Promise<WaterQualityReading>;
  getById(id: string): Promise<WaterQualityReading>;
  list(query: WaterQualityListQueryContract): Promise<ListResponse<WaterQualityReading>>;
  listByPond(pondId: string): Promise<ListResponse<WaterQualityReading>>;
}
