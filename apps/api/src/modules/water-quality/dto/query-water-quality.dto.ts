import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryWaterQualityDto extends QueryFilterBaseDto {
  pondId?: string;
  from?: string;
  to?: string;
}
