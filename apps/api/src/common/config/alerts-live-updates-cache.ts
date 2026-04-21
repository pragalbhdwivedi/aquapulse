import type { ISODateString } from "@aquapulse/types";

export interface AlertsLiveUpdatesGatewayState {
  readonly gatewayAttached: boolean;
  readonly activeConnections: number;
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
