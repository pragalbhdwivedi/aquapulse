import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryAlertsDto extends QueryFilterBaseDto {
  severity?: string;
  status?: string;
  pondId?: string;
}
