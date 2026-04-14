import type { AlertLifecycleActionRequest } from "@aquapulse/types";

export class ResolveAlertDto implements AlertLifecycleActionRequest {
  note?: string;
}
