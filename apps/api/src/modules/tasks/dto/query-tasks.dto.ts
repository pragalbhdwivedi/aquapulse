import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryTasksDto extends QueryFilterBaseDto {
  status?: string;
  assigneeId?: string;
}
