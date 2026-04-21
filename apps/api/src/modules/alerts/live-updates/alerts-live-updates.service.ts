import type { Server as HttpServer, IncomingMessage } from "node:http";
import { Injectable } from "@nestjs/common";
import type {
  AlertLiveUpdateEvent,
  BackendAlertsLiveUpdatesDiagnostics,
  RuntimeWarning
} from "@aquapulse/types";
import { WebSocketServer, WebSocket } from "ws";
import {
  getCachedAlertsLiveUpdatesGatewayState,
  setCachedAlertsLiveUpdatesGatewayState
} from "../../../common/config/alerts-live-updates-cache";
import {
  readAlertsLiveUpdatesRuntimeConfig,
  type AlertsLiveUpdatesRuntimeEnvSource
} from "./alerts-live-updates.config";

@Injectable()
export class AlertsLiveUpdatesService {
  private readonly runtime = readAlertsLiveUpdatesRuntimeConfig(
    process.env as AlertsLiveUpdatesRuntimeEnvSource
  );
  private gateway?: WebSocketServer;
  private attached = false;

  constructor() {
    this.updateCachedState();
  }

  attachGateway(httpServer: HttpServer) {
    if (!this.runtime.enabled || this.attached) {
      this.updateCachedState();
      return;
    }

    this.gateway = new WebSocketServer({ noServer: true });
    httpServer.on("upgrade", (request, socket, head) => {
      if (!this.shouldHandleUpgrade(request)) {
        return;
      }

      this.gateway?.handleUpgrade(request, socket, head, (client: WebSocket) => {
        this.gateway?.emit("connection", client, request);
      });
    });

    this.gateway.on("connection", (client: WebSocket) => {
      this.updateCachedState();
      client.on("close", () => this.updateCachedState());
      client.on("error", () => this.updateCachedState());
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

    setCachedAlertsLiveUpdatesGatewayState({
      gatewayAttached: this.attached,
      activeConnections: this.gateway.clients.size,
      lastEventAt: event.timestamp
    });
  }

  getRuntimeDiagnostics(): BackendAlertsLiveUpdatesDiagnostics {
    const cachedState = getCachedAlertsLiveUpdatesGatewayState();
    const warnings: RuntimeWarning[] = [...this.runtime.warnings];

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
      lastEventAt: cachedState?.lastEventAt,
      warnings
    };
  }

  private shouldHandleUpgrade(request: IncomingMessage): boolean {
    const requestUrl = request.url ?? "";
    const pathname = new URL(requestUrl, "http://localhost").pathname.replace(/\/+$/, "") || "/";
    return pathname === this.runtime.path;
  }

  private updateCachedState() {
    setCachedAlertsLiveUpdatesGatewayState({
      gatewayAttached: this.attached,
      activeConnections: this.gateway?.clients.size ?? 0,
      lastEventAt: getCachedAlertsLiveUpdatesGatewayState()?.lastEventAt
    });
  }
}
