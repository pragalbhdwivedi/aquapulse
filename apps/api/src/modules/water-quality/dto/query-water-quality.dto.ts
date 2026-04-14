import type { WaterQualityListQueryContract } from "../query-contracts/water-quality-query.contract";
import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryWaterQualityDto extends QueryFilterBaseDto implements WaterQualityListQueryContract {
  pondId?: string;
  metric?: "temperatureC" | "ph";
}
