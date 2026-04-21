import type { ISODateString } from "@aquapulse/types";

export interface AlertsLiveUpdatesGatewayState {
  readonly gatewayAttached: boolean;
  readonly activeConnections: number;
  readonly authenticatedConnections: number;
  readonly bypassedConnections: number;
  readonly lastSubscriptionAt?: ISODateString;
  readonly lastSubscriptionState?:
    | "authenticated"
    | "bypassed_local"
    | "rejected_missing_auth"
    | "rejected_invalid_auth"
    | "rejected_insufficient_access";
  readonly lastSubscriptionReason?: string;
  readonly lastEventAt?: ISODateString;
}

let cachedAlertsLiveUpdatesGatewayState: AlertsLiveUpdatesGatewayState | undefined;

export function setCachedAlertsLiveUpdatesGatewayState(
  state: AlertsLiveUpdatesGatewayState | undefined
) {
  cachedAlertsLiveUpdatesGatewayState = state;
}

export function getCachedAlertsLiveUpdatesGatewayState():
  | AlertsLiveUpdatesGatewayState
  | undefined {
  return cachedAlertsLiveUpdatesGatewayState;
}
