import type { TaskStatus } from "@aquapulse/types";
import type { TasksListQueryContract } from "../query-contracts/tasks-query.contract";
import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryTasksDto extends QueryFilterBaseDto implements TasksListQueryContract {
  assigneeId?: string;
  pondId?: string;
  status?: TaskStatus;
}
