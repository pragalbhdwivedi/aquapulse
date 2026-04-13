import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryPondsDto extends QueryFilterBaseDto {
  farmId?: string;
  status?: "active" | "maintenance" | "inactive";
}
