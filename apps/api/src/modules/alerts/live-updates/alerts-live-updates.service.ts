import type { Server as HttpServer, IncomingMessage } from "node:http";
import { Injectable } from "@nestjs/common";
import type {
  AlertLiveUpdateEvent,
  AlertsLiveUpdatesSubscriptionStatus,
  AquaPulseAuthMode,
  BackendAlertsLiveUpdatesDiagnostics,
  RuntimeWarning
} from "@aquapulse/types";
import { WebSocketServer, WebSocket } from "ws";
import { ApiAuthService } from "../../../common/auth/api-auth.service";
import {
  getCachedAlertsLiveUpdatesGatewayState,
  setCachedAlertsLiveUpdatesGatewayState
} from "../../../common/config/alerts-live-updates-cache";
import {
  readAlertsLiveUpdatesRuntimeConfig,
  type AlertsLiveUpdatesRuntimeEnvSource
} from "./alerts-live-updates.config";

type AcceptedSubscriptionState = "authenticated" | "bypassed_local";
type RejectedSubscriptionState =
  | "rejected_missing_auth"
  | "rejected_invalid_auth"
  | "rejected_insufficient_access";

interface SubscriptionAcceptanceDecision {
  readonly accepted: true;
  readonly authMode: AquaPulseAuthMode;
  readonly subscriptionAuthState: AcceptedSubscriptionState;
  readonly message: string;
}

interface SubscriptionRejectionDecision {
  readonly accepted: false;
  readonly authMode: AquaPulseAuthMode;
  readonly subscriptionState: RejectedSubscriptionState;
  readonly statusCode: 401 | 403;
  readonly message: string;
}

type SubscriptionDecision = SubscriptionAcceptanceDecision | SubscriptionRejectionDecision;

@Injectable()
export class AlertsLiveUpdatesService {
  private readonly runtime = readAlertsLiveUpdatesRuntimeConfig(
    process.env as AlertsLiveUpdatesRuntimeEnvSource
  );
  private gateway?: WebSocketServer;
  private attached = false;
  private readonly clientSubscriptionStates = new WeakMap<WebSocket, AcceptedSubscriptionState>();

  constructor(private readonly authService: ApiAuthService) {
    this.updateCachedState();
  }

  attachGateway(httpServer: HttpServer) {
    if (!this.runtime.enabled || this.attached) {
      this.updateCachedState();
      return;
    }

    this.gateway = new WebSocketServer({ noServer: true });
    httpServer.on("upgrade", async (request, socket, head) => {
      if (!this.shouldHandleUpgrade(request)) {
        return;
      }

      const decision = await this.resolveSubscriptionDecision(request);
      if (!decision.accepted) {
        this.recordRejectedSubscription(decision);
        socket.write(
          `HTTP/1.1 ${decision.statusCode} ${decision.statusCode === 401 ? "Unauthorized" : "Forbidden"}\r\nConnection: close\r\n\r\n`
        );
        socket.destroy();
        return;
      }

      this.gateway?.handleUpgrade(request, socket, head, (client: WebSocket) => {
        this.clientSubscriptionStates.set(client, decision.subscriptionAuthState);
        this.gateway?.emit("connection", client, request);
        client.send(JSON.stringify(this.toSubscriptionStatus(decision)));
      });
    });

    this.gateway.on("connection", (client: WebSocket) => {
      this.recordAcceptedSubscription(this.clientSubscriptionStates.get(client) ?? "bypassed_local");
      this.updateCachedState();
      client.on("close", () => {
        this.clientSubscriptionStates.delete(client);
        this.updateCachedState();
      });
      client.on("error", () => {
        this.clientSubscriptionStates.delete(client);
        this.updateCachedState();
      });
    });

    this.attached = true;
    this.updateCachedState();
  }

  emit(event: AlertLiveUpdateEvent) {
    if (!this.runtime.enabled || !this.gateway) {
      return;
    }

    const payload = JSON.stringify(event);

    for (const client of this.gateway.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }

    const previous = getCachedAlertsLiveUpdatesGatewayState();
    setCachedAlertsLiveUpdatesGatewayState({
      gatewayAttached: this.attached,
      activeConnections: this.gateway.clients.size,
      authenticatedConnections: previous?.authenticatedConnections ?? 0,
      bypassedConnections: previous?.bypassedConnections ?? 0,
      lastSubscriptionAt: previous?.lastSubscriptionAt,
      lastSubscriptionState: previous?.lastSubscriptionState,
      lastSubscriptionReason: previous?.lastSubscriptionReason,
      lastEventAt: event.timestamp
    });
  }

  getRuntimeDiagnostics(): BackendAlertsLiveUpdatesDiagnostics {
    const cachedState = getCachedAlertsLiveUpdatesGatewayState();
    const warnings: RuntimeWarning[] = [...this.runtime.warnings];
    const authRuntime = this.authService.getRuntimeConfig();

    if (!this.runtime.enabled) {
      warnings.push({
        code: "ALERTS_LIVE_UPDATES_DISABLED",
        message:
          "Alerts live updates are disabled by default. Enable AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES to attach the local websocket gateway."
      });
    }

    return {
      enabled: this.runtime.enabled,
      gatewayPath: this.runtime.path,
      gatewayAttached: cachedState?.gatewayAttached ?? false,
      activeConnections: cachedState?.activeConnections ?? 0,
      subscriptionPolicy: !this.runtime.enabled
        ? "disabled"
        : authRuntime.effectiveMode === "keycloak"
          ? "authenticated_operator_required"
          : "bypassed_local",
      authenticatedConnections: cachedState?.authenticatedConnections ?? 0,
      bypassedConnections: cachedState?.bypassedConnections ?? 0,
      lastSubscriptionAt: cachedState?.lastSubscriptionAt,
      lastSubscriptionState: cachedState?.lastSubscriptionState,
      lastSubscriptionReason: cachedState?.lastSubscriptionReason,
      lastEventAt: cachedState?.lastEventAt,
      warnings
    };
  }

  async resolveSubscriptionDecision(
    request: Pick<IncomingMessage, "headers" | "url">
  ): Promise<SubscriptionDecision> {
    const authRuntime = this.authService.getRuntimeConfig();

    if (authRuntime.effectiveMode !== "keycloak") {
      return {
        accepted: true,
        authMode: authRuntime.effectiveMode,
        subscriptionAuthState: "bypassed_local",
        message:
          authRuntime.effectiveMode === "local"
            ? "Alerts live updates are using the local auth bypass path."
            : "Alerts live updates are using the auth-disabled local bypass path."
      };
    }

    const bearerToken = this.readSubscriptionBearerToken(request);
    if (!bearerToken) {
      return {
        accepted: false,
        authMode: authRuntime.effectiveMode,
        subscriptionState: "rejected_missing_auth",
        statusCode: 401,
        message:
          "Alerts live updates require an authenticated operator bearer token when Keycloak mode is active."
      };
    }

    const user = await this.authService.resolveRequestUser({
      headers: {
        ...request.headers,
        authorization: request.headers.authorization ?? `Bearer ${bearerToken}`
      }
    });

    if (!user) {
      return {
        accepted: false,
        authMode: authRuntime.effectiveMode,
        subscriptionState: "rejected_invalid_auth",
        statusCode: 401,
        message:
          "Alerts live updates rejected the websocket subscription because the bearer token could not be verified."
      };
    }

    if (!this.authService.hasOperatorAccess(user)) {
      return {
        accepted: false,
        authMode: authRuntime.effectiveMode,
        subscriptionState: "rejected_insufficient_access",
        statusCode: 403,
        message:
          "Alerts live updates require operator access when Keycloak mode is active."
      };
    }

    return {
      accepted: true,
      authMode: authRuntime.effectiveMode,
      subscriptionAuthState: "authenticated",
      message:
        "Alerts live updates accepted an authenticated operator websocket subscription."
    };
  }

  private shouldHandleUpgrade(request: IncomingMessage): boolean {
    const requestUrl = request.url ?? "";
    const pathname = new URL(requestUrl, "http://localhost").pathname.replace(/\/+$/, "") || "/";
    return pathname === this.runtime.path;
  }

  private updateCachedState() {
    const clients = [...(this.gateway?.clients ?? [])];
    const authenticatedConnections = clients.filter(
      (client) => this.clientSubscriptionStates.get(client) === "authenticated"
    ).length;
    const bypassedConnections = clients.filter(
      (client) => this.clientSubscriptionStates.get(client) === "bypassed_local"
    ).length;
    const previous = getCachedAlertsLiveUpdatesGatewayState();
    setCachedAlertsLiveUpdatesGatewayState({
      gatewayAttached: this.attached,
      activeConnections: this.gateway?.clients.size ?? 0,
      authenticatedConnections,
      bypassedConnections,
      lastSubscriptionAt: previous?.lastSubscriptionAt,
      lastSubscriptionState: previous?.lastSubscriptionState,
      lastSubscriptionReason: previous?.lastSubscriptionReason,
      lastEventAt: previous?.lastEventAt
    });
  }

  private recordAcceptedSubscription(state: AcceptedSubscriptionState) {
    const previous = getCachedAlertsLiveUpdatesGatewayState();
    setCachedAlertsLiveUpdatesGatewayState({
      gatewayAttached: this.attached,
      activeConnections: this.gateway?.clients.size ?? 0,
      authenticatedConnections:
        state === "authenticated"
          ? (previous?.authenticatedConnections ?? 0) + 1
          : previous?.authenticatedConnections ?? 0,
      bypassedConnections:
        state === "bypassed_local"
          ? (previous?.bypassedConnections ?? 0) + 1
          : previous?.bypassedConnections ?? 0,
      lastSubscriptionAt: new Date().toISOString(),
      lastSubscriptionState: state,
      lastSubscriptionReason:
        state === "authenticated"
          ? "Accepted an authenticated alerts websocket subscription."
          : "Accepted a bypassed-local alerts websocket subscription.",
      lastEventAt: previous?.lastEventAt
    });
  }

  private recordRejectedSubscription(decision: SubscriptionRejectionDecision) {
    const previous = getCachedAlertsLiveUpdatesGatewayState();
    setCachedAlertsLiveUpdatesGatewayState({
      gatewayAttached: this.attached,
      activeConnections: this.gateway?.clients.size ?? 0,
      authenticatedConnections: previous?.authenticatedConnections ?? 0,
      bypassedConnections: previous?.bypassedConnections ?? 0,
      lastSubscriptionAt: new Date().toISOString(),
      lastSubscriptionState: decision.subscriptionState,
      lastSubscriptionReason: decision.message,
      lastEventAt: previous?.lastEventAt
    });
  }

  private readSubscriptionBearerToken(
    request: Pick<IncomingMessage, "headers" | "url">
  ): string | undefined {
    const authorizationHeader = Array.isArray(request.headers.authorization)
      ? request.headers.authorization[0]
      : request.headers.authorization;
    if (authorizationHeader?.startsWith("Bearer ")) {
      return authorizationHeader.slice("Bearer ".length).trim() || undefined;
    }

    const requestUrl = request.url ?? "";
    const token = new URL(requestUrl, "http://localhost").searchParams.get("access_token")?.trim();
    return token || undefined;
  }

  private toSubscriptionStatus(
    decision: SubscriptionAcceptanceDecision
  ): AlertsLiveUpdatesSubscriptionStatus {
    return {
      source: "alerts_live_updates",
      kind: "subscription_status",
      timestamp: new Date().toISOString(),
      authMode: decision.authMode,
      subscriptionAuthState: decision.subscriptionAuthState,
      message: decision.message
    };
  }
}
