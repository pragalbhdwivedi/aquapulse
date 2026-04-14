import type { RepositoryListQuery } from "@aquapulse/database";

export interface FeedListQueryContract extends RepositoryListQuery {
  readonly pondId?: string;
  readonly batchId?: string;
  readonly feedType?: string;
}
