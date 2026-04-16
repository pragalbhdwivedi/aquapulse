import type { AlertUnassignActionRequest } from "@aquapulse/types";

export class UnassignAlertDto implements AlertUnassignActionRequest {
  note?: string;
}
