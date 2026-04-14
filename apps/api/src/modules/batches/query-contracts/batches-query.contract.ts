import type { RepositoryListQuery } from "@aquapulse/database";
import type { BatchSummary } from "@aquapulse/types";

export interface BatchesListQueryContract extends RepositoryListQuery {
  readonly pondId?: string;
  readonly lifecycleStage?: BatchSummary["lifecycleStage"];
}
