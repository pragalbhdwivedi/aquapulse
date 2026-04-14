import type { FeedListQueryContract } from "../query-contracts/feed-query.contract";
import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryFeedDto extends QueryFilterBaseDto implements FeedListQueryContract {
  pondId?: string;
  batchId?: string;
  feedType?: string;
}
