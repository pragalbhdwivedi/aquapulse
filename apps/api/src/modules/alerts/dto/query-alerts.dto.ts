import type { AlertReviewState, AlertSeverity } from "@aquapulse/types";
import type { AlertsListQueryContract } from "../query-contracts/alerts-query.contract";
import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryAlertsDto extends QueryFilterBaseDto implements AlertsListQueryContract {
  pondId?: string;
  severity?: AlertSeverity;
  status?: "open" | "acknowledged" | "resolved";
  source?: string;
  assignedTo?: string;
  reviewState?: AlertReviewState;
  hasLatestNote?: boolean;
  sortBy?: "updatedAt_desc" | "updatedAt_asc" | "createdAt_desc" | "createdAt_asc";
}
