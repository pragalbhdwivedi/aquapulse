import type { AlertReviewState, AlertSeverity } from "@aquapulse/types";

export class UpdateAlertsDto {
  id?: string;
  title?: string;
  severity?: AlertSeverity;
  source?: string;
  pondId?: string;
  status?: "open" | "acknowledged" | "resolved";
  assignedTo?: string;
  reviewState?: AlertReviewState;
  reviewLabel?: string;
  latestNote?: string;
}
