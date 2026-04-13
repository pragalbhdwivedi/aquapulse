import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryFeedDto extends QueryFilterBaseDto {
  pondId?: string;
  batchId?: string;
}
