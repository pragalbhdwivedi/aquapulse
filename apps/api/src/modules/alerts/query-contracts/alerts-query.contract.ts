import type { RepositoryListQuery } from "@aquapulse/database";
import type { AlertSeverity } from "@aquapulse/types";

export interface AlertsListQueryContract extends RepositoryListQuery {
  readonly pondId?: string;
  readonly severity?: AlertSeverity;
  readonly status?: "open" | "acknowledged" | "resolved";
  readonly source?: string;
}
