import type { AlertBulkLifecycleActionRequest } from "@aquapulse/types";

export class BulkResolveAlertsDto implements AlertBulkLifecycleActionRequest {
  alertIds!: string[];
  note?: string;
}
