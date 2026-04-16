import type { BatchSummary } from "@aquapulse/types";
import type { BatchesListQueryContract } from "../query-contracts/batches-query.contract";
import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryBatchesDto extends QueryFilterBaseDto implements BatchesListQueryContract {
  pondId?: string;
  lifecycleStage?: BatchSummary["lifecycleStage"];
}
