import type { AlertBulkLifecycleActionRequest } from "@aquapulse/types";

export class BulkAcknowledgeAlertsDto implements AlertBulkLifecycleActionRequest {
  alertIds!: string[];
  note?: string;
}
