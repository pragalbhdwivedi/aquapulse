import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryBatchesDto extends QueryFilterBaseDto {
  pondId?: string;
  lifecycleStage?: string;
}
