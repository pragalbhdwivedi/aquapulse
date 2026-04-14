import type { AlertSeverity } from "@aquapulse/types";

export class CreateAlertsDto {
  id?: string;
  title?: string;
  severity?: AlertSeverity;
  source?: string;
  pondId?: string;
  status?: "open" | "acknowledged" | "resolved";
}
