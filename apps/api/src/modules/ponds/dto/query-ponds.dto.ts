import type { PondListQueryContract } from "../query-contracts/ponds-query.contract";
import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryPondsDto extends QueryFilterBaseDto implements PondListQueryContract {
  farmId?: string;
  status?: "active" | "maintenance" | "inactive";
  kind?: "pond" | "tank" | "cage";
}
