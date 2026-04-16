import type { AlertBulkAssignActionRequest } from "@aquapulse/types";

export class BulkAssignAlertsDto implements AlertBulkAssignActionRequest {
  alertIds!: string[];
  assignedTo!: string;
  note?: string;
}
