import type { AlertLifecycleActionRequest } from "@aquapulse/types";

export class AcknowledgeAlertDto implements AlertLifecycleActionRequest {
  note?: string;
}
