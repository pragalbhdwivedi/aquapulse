import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryAuditDto extends QueryFilterBaseDto {
  actorId?: string;
  resourceType?: string;
}
