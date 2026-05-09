import type { Server as HttpServer, IncomingMessage } from "node:http";
import { randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type {
  AlertLiveUpdateEvent,
  AlertsLiveUpdatesBootstrapPayload,
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
  | "rejected_invalid_ticket"
  | "rejected_expired_ticket"
  | "rejected_missing_auth"
  | "rejected_invalid_auth"
  | "rejected_insufficient_access";

type TicketIssuableSubscriptionState = "authenticated" | "bypassed_local";

interface LiveUpdatesSubscriptionTicket {
  readonly id: string;
  readonly expiresAt: number;
  readonly authMode: AquaPulseAuthMode;
  readonly subscriptionAuthState: TicketIssuableSubscriptionState;
}

interface LiveUpdatesRequestLike {
  readonly headers?: Record<string, string | string[] | undefined>;
  readonly url?: string;
}

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
  private readonly subscriptionTickets = new Map<string, LiveUpdatesSubscriptionTicket>();

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
      lastTicketIssuedAt: previous?.lastTicketIssuedAt,
      lastTicketIssuedState: previous?.lastTicketIssuedState,
      lastSubscriptionAt: previous?.lastSubscriptionAt,
      lastSubscriptionState: previous?.lastSubscriptionState,
      lastSubscriptionReason: previous?.lastSubscriptionReason,
      lastEventAt: event.timestamp
    });
  }

  async issueSubscriptionBootstrap(
    request: LiveUpdatesRequestLike
  ): Promise<AlertsLiveUpdatesBootstrapPayload> {
    const authRuntime = this.authService.getRuntimeConfig();
    const warnings: RuntimeWarning[] = [...this.runtime.warnings];
    const now = Date.now();
    const webSocketTarget = this.deriveWebSocketTarget(request);

    if (!this.runtime.enabled) {
      this.recordTicketIssuance("unavailable");

      return {
        requested: false,
        enabled: false,
        subscriptionTransport: "local_proxy_bootstrap",
        credentialMode: "none",
        targetLabel: this.runtime.ticketBootstrapPath,
        ticketIssued: false,
        subscriptionAuthState: "unavailable",
        authMode: authRuntime.effectiveMode,
        forwardedAuthPresent: Boolean(this.readSubscriptionBearerToken(request)),
        forwardingSource: this.readSubscriptionBearerToken(request) ? "authorization_header" : "none",
        warnings: [
          ...warnings,
          {
            code: "ALERTS_LIVE_UPDATES_DISABLED",
            message:
              "Alerts live updates are disabled by default. Enable AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES to attach the local websocket gateway."
          }
        ]
      };
    }

    if (authRuntime.requestedMode === "keycloak" && authRuntime.effectiveMode === "disabled") {
      this.recordTicketIssuance("degraded");

      return {
        requested: true,
        enabled: true,
        subscriptionTransport: "local_proxy_bootstrap",
        credentialMode: "none",
        targetLabel: this.runtime.ticketBootstrapPath,
        ticketIssued: false,
        subscriptionAuthState: "degraded",
        authMode: authRuntime.effectiveMode,
        forwardedAuthPresent: Boolean(this.readSubscriptionBearerToken(request)),
        forwardingSource: this.readSubscriptionBearerToken(request) ? "authorization_header" : "none",
        warnings: warnings
      };
    }

    if (authRuntime.effectiveMode === "keycloak") {
      const user = await this.authService.resolveRequestUser({
        headers: request.headers
      });
      const forwardedAuthPresent = Boolean(this.readSubscriptionBearerToken(request));

      if (!user) {
        this.recordTicketIssuance("degraded");

        return {
          requested: true,
          enabled: true,
          subscriptionTransport: "local_proxy_bootstrap",
          credentialMode: "none",
          targetLabel: this.runtime.ticketBootstrapPath,
          ticketIssued: false,
          subscriptionAuthState: "degraded",
          authMode: authRuntime.effectiveMode,
          forwardedAuthPresent,
          forwardingSource: forwardedAuthPresent ? "authorization_header" : "none",
          warnings: [
            ...warnings,
            {
              code: "ALERTS_LIVE_UPDATES_TICKET_AUTH_REQUIRED",
              message:
                "Alerts live updates require an authenticated operator session before the backend can issue an ephemeral subscription ticket."
            }
          ]
        };
      }

      if (!this.authService.hasOperatorAccess(user)) {
        this.recordTicketIssuance("degraded");

        return {
          requested: true,
          enabled: true,
          subscriptionTransport: "local_proxy_bootstrap",
          credentialMode: "none",
          targetLabel: this.runtime.ticketBootstrapPath,
          ticketIssued: false,
          subscriptionAuthState: "degraded",
          authMode: authRuntime.effectiveMode,
          forwardedAuthPresent,
          forwardingSource: "authorization_header",
          warnings: [
            ...warnings,
            {
              code: "ALERTS_LIVE_UPDATES_TICKET_OPERATOR_REQUIRED",
              message:
                "Alerts live updates require operator access before the backend can issue an authenticated ephemeral subscription ticket."
            }
          ]
        };
      }

      const ticket = this.issueTicket({
        authMode: authRuntime.effectiveMode,
        subscriptionAuthState: "authenticated"
      });

      return {
        requested: true,
        enabled: true,
        subscriptionTransport: "local_proxy_bootstrap",
        credentialMode: "ephemeral_ticket",
        targetLabel: this.runtime.ticketBootstrapPath,
        webSocketUrl: `${webSocketTarget}?subscription_ticket=${encodeURIComponent(ticket.id)}`,
        ticketIssued: true,
        ticketExpiresAt: new Date(ticket.expiresAt).toISOString(),
        subscriptionAuthState: "authenticated",
        authMode: authRuntime.effectiveMode,
        forwardedAuthPresent: true,
        forwardingSource: "authorization_header",
        warnings
      };
    }

    const ticket = this.issueTicket({
      authMode: authRuntime.effectiveMode,
      subscriptionAuthState: "bypassed_local"
    });

    return {
      requested: true,
      enabled: true,
      subscriptionTransport: "local_proxy_bootstrap",
      credentialMode: "ephemeral_ticket",
      targetLabel: this.runtime.ticketBootstrapPath,
      webSocketUrl: `${webSocketTarget}?subscription_ticket=${encodeURIComponent(ticket.id)}`,
      ticketIssued: true,
      ticketExpiresAt: new Date(ticket.expiresAt).toISOString(),
      subscriptionAuthState: "bypassed_local",
      authMode: authRuntime.effectiveMode,
      forwardedAuthPresent: false,
      forwardingSource: "none",
      warnings
    };
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
      ticketBootstrapPath: this.runtime.ticketBootstrapPath,
      ticketTtlSeconds: Math.floor(this.runtime.ticketTtlMs / 1000),
      gatewayAttached: cachedState?.gatewayAttached ?? false,
      activeConnections: cachedState?.activeConnections ?? 0,
      subscriptionPolicy: !this.runtime.enabled
        ? "disabled"
        : authRuntime.effectiveMode === "keycloak"
          ? "authenticated_operator_required"
          : "bypassed_local",
      credentialMode: this.runtime.enabled ? "ephemeral_ticket" : "none",
      authenticatedConnections: cachedState?.authenticatedConnections ?? 0,
      bypassedConnections: cachedState?.bypassedConnections ?? 0,
      lastTicketIssuedAt: cachedState?.lastTicketIssuedAt,
      lastTicketIssuedState: cachedState?.lastTicketIssuedState,
      lastSubscriptionAt: cachedState?.lastSubscriptionAt,
      lastSubscriptionState: cachedState?.lastSubscriptionState,
      lastSubscriptionReason: cachedState?.lastSubscriptionReason,
      lastEventAt: cachedState?.lastEventAt,
      warnings
    };
  }

  async resolveSubscriptionDecision(
    request: LiveUpdatesRequestLike
  ): Promise<SubscriptionDecision> {
    const authRuntime = this.authService.getRuntimeConfig();
    const subscriptionTicket = this.readSubscriptionTicket(request);

    if (subscriptionTicket) {
      const decision = this.resolveSubscriptionTicket(subscriptionTicket);
      if (decision) {
        return decision;
      }
    }

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
        ...(request.headers ?? {}),
        authorization: request.headers?.authorization ?? `Bearer ${bearerToken}`
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
    this.pruneExpiredTickets();
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
      lastTicketIssuedAt: previous?.lastTicketIssuedAt,
      lastTicketIssuedState: previous?.lastTicketIssuedState,
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
      lastTicketIssuedAt: previous?.lastTicketIssuedAt,
      lastTicketIssuedState: previous?.lastTicketIssuedState,
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
      lastTicketIssuedAt: previous?.lastTicketIssuedAt,
      lastTicketIssuedState: previous?.lastTicketIssuedState,
      lastSubscriptionAt: new Date().toISOString(),
      lastSubscriptionState: decision.subscriptionState,
      lastSubscriptionReason: decision.message,
      lastEventAt: previous?.lastEventAt
    });
  }

  private readSubscriptionBearerToken(
    request: LiveUpdatesRequestLike
  ): string | undefined {
    const authorization = request.headers?.authorization;
    const authorizationHeader = Array.isArray(authorization) ? authorization[0] : authorization;
    if (authorizationHeader?.startsWith("Bearer ")) {
      return authorizationHeader.slice("Bearer ".length).trim() || undefined;
    }

    const requestUrl = request.url ?? "";
    const token = new URL(requestUrl, "http://localhost").searchParams.get("access_token")?.trim();
    return token || undefined;
  }

  private readSubscriptionTicket(
    request: LiveUpdatesRequestLike
  ): string | undefined {
    const requestUrl = request.url ?? "";
    const ticket = new URL(requestUrl, "http://localhost").searchParams.get("subscription_ticket")?.trim();
    return ticket || undefined;
  }

  private issueTicket(input: {
    readonly authMode: AquaPulseAuthMode;
    readonly subscriptionAuthState: TicketIssuableSubscriptionState;
  }): LiveUpdatesSubscriptionTicket {
    this.pruneExpiredTickets();
    const ticket: LiveUpdatesSubscriptionTicket = {
      id: randomBytes(24).toString("base64url"),
      expiresAt: Date.now() + this.runtime.ticketTtlMs,
      authMode: input.authMode,
      subscriptionAuthState: input.subscriptionAuthState
    };

    this.subscriptionTickets.set(ticket.id, ticket);
    this.recordTicketIssuance(input.subscriptionAuthState);
    return ticket;
  }

  private resolveSubscriptionTicket(ticketId: string): SubscriptionDecision | undefined {
    const ticket = this.subscriptionTickets.get(ticketId);
    if (!ticket) {
      this.pruneExpiredTickets();
      return {
        accepted: false,
        authMode: this.authService.getRuntimeConfig().effectiveMode,
        subscriptionState: "rejected_invalid_ticket",
        statusCode: 401,
        message:
          "Alerts live updates rejected the websocket subscription because the ephemeral subscription ticket was invalid."
      };
    }

    if (ticket.expiresAt <= Date.now()) {
      this.subscriptionTickets.delete(ticketId);
      this.pruneExpiredTickets();
      return {
        accepted: false,
        authMode: ticket.authMode,
        subscriptionState: "rejected_expired_ticket",
        statusCode: 401,
        message:
          "Alerts live updates rejected the websocket subscription because the ephemeral subscription ticket had expired."
      };
    }

    this.subscriptionTickets.delete(ticketId);
    this.pruneExpiredTickets();
    return {
      accepted: true,
      authMode: ticket.authMode,
      subscriptionAuthState: ticket.subscriptionAuthState,
      message:
        ticket.subscriptionAuthState === "authenticated"
          ? "Alerts live updates accepted an authenticated operator websocket subscription through an ephemeral ticket."
          : "Alerts live updates accepted a bypassed-local websocket subscription through an ephemeral ticket."
    };
  }

  private pruneExpiredTickets() {
    const now = Date.now();
    for (const [ticketId, ticket] of this.subscriptionTickets.entries()) {
      if (ticket.expiresAt <= now) {
        this.subscriptionTickets.delete(ticketId);
      }
    }
  }

  private recordTicketIssuance(
    state: "authenticated" | "bypassed_local" | "degraded" | "unavailable"
  ) {
    const previous = getCachedAlertsLiveUpdatesGatewayState();
    setCachedAlertsLiveUpdatesGatewayState({
      gatewayAttached: this.attached,
      activeConnections: this.gateway?.clients.size ?? 0,
      authenticatedConnections: previous?.authenticatedConnections ?? 0,
      bypassedConnections: previous?.bypassedConnections ?? 0,
      lastTicketIssuedAt: new Date().toISOString(),
      lastTicketIssuedState: state,
      lastSubscriptionAt: previous?.lastSubscriptionAt,
      lastSubscriptionState: previous?.lastSubscriptionState,
      lastSubscriptionReason: previous?.lastSubscriptionReason,
      lastEventAt: previous?.lastEventAt
    });
  }

  private deriveWebSocketTarget(
    request: LiveUpdatesRequestLike
  ): string {
    const hostHeader = request.headers?.host;
    const forwardedProtoHeader = request.headers?.["x-forwarded-proto"];
    const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
    const forwardedProto = Array.isArray(forwardedProtoHeader)
      ? forwardedProtoHeader[0]
      : forwardedProtoHeader;
    const protocol = forwardedProto === "https" ? "wss" : "ws";
    return `${protocol}://${host ?? "localhost:4000"}${this.runtime.path}`;
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
