import type { ISODateString } from "@aquapulse/types";

export interface AlertsLiveUpdatesGatewayState {
  readonly gatewayAttached: boolean;
  readonly activeConnections: number;
  readonly authenticatedConnections: number;
  readonly bypassedConnections: number;
  readonly lastTicketIssuedAt?: ISODateString;
  readonly lastTicketIssuedState?:
    | "authenticated"
    | "bypassed_local"
    | "degraded"
    | "unavailable";
  readonly lastSubscriptionAt?: ISODateString;
  readonly lastSubscriptionState?:
    | "authenticated"
    | "bypassed_local"
    | "ticket_authenticated"
    | "ticket_bypassed_local"
    | "rejected_invalid_ticket"
    | "rejected_expired_ticket"
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
