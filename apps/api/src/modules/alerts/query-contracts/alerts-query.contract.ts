import type { AlertsListQueryRequest } from "@aquapulse/types";

export interface AlertsListQueryContract extends AlertsListQueryRequest {
  readonly alertId?: string;
}
