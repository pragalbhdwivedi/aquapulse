import type {
  AlertLiveUpdateEvent,
  AlertsLiveUpdatesConnectionState,
  AlertsLiveUpdatesRuntimeDiagnostics
} from "@aquapulse/types";
import type { AquaPulseClientRuntimeConfig } from "@web/clients/runtime-config";
import { getAlertsLiveUpdatesRuntimeDiagnostics } from "@web/clients/runtime-config";

export interface AlertsLiveUpdatesConnection {
  disconnect(): void;
}

export interface AlertsLiveUpdatesStateDescription {
  readonly label: string;
  readonly helperText: string;
}

export interface AlertsLiveUpdatesConnectorOptions {
  readonly config: AquaPulseClientRuntimeConfig;
  readonly onEvent: (event: AlertLiveUpdateEvent) => void;
  readonly onStateChange?: (state: AlertsLiveUpdatesConnectionState) => void;
  readonly webSocketFactory?: (url: string) => WebSocketLike;
}

interface WebSocketLike {
  close(): void;
  addEventListener(type: "open", listener: () => void): void;
  addEventListener(type: "error", listener: () => void): void;
  addEventListener(type: "close", listener: () => void): void;
  addEventListener(type: "message", listener: (event: { readonly data: unknown }) => void): void;
}

function createBrowserWebSocket(url: string): WebSocketLike {
  return new WebSocket(url);
}

function isAlertLiveUpdateEvent(value: unknown): value is AlertLiveUpdateEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AlertLiveUpdateEvent>;
  return candidate.source === "alerts" && typeof candidate.eventType === "string";
}

export function deriveAlertsLiveUpdatesIndicator(
  config: AquaPulseClientRuntimeConfig
): AlertsLiveUpdatesRuntimeDiagnostics {
  return getAlertsLiveUpdatesRuntimeDiagnostics(config);
}

export function describeAlertsLiveUpdatesState(
  diagnostics: AlertsLiveUpdatesRuntimeDiagnostics,
  state: AlertsLiveUpdatesConnectionState
): AlertsLiveUpdatesStateDescription {
  switch (state) {
    case "disabled":
      return {
        label: "disabled",
        helperText: "Alerts live updates are off. Manual refresh remains the safe default path."
      };
    case "inactive":
      return {
        label: diagnostics.enabled ? "idle" : "inactive",
        helperText: diagnostics.enabled
          ? "The websocket path is configured, but there is no active live connection right now. Manual refresh remains available."
          : "Live updates are not actively connected. Manual refresh remains available."
      };
    case "connecting":
      return {
        label: "connecting",
        helperText: "AquaPulse is opening the alerts websocket connection."
      };
    case "active":
      return {
        label: "active",
        helperText: "Alerts live updates are connected and queue refreshes can react to inbound events."
      };
    case "degraded":
      return {
        label: "degraded",
        helperText:
          "The websocket connected, but live event handling entered a degraded state. Manual refresh remains the fallback."
      };
    case "unavailable":
    default:
      return {
        label: "unavailable",
        helperText: diagnostics.enabled
          ? "Alerts live updates were requested, but the websocket path is not reachable right now. Manual refresh remains the fallback."
          : "Alerts live updates were requested, but runtime/config setup is incomplete. Manual refresh remains the fallback."
      };
  }
}

export function connectAlertsLiveUpdates(
  options: AlertsLiveUpdatesConnectorOptions
): AlertsLiveUpdatesConnection {
  const diagnostics = deriveAlertsLiveUpdatesIndicator(options.config);
  const onStateChange = options.onStateChange ?? (() => undefined);
  let currentState: AlertsLiveUpdatesConnectionState = diagnostics.connectionState;
  const setState = (state: AlertsLiveUpdatesConnectionState) => {
    currentState = state;
    onStateChange(state);
  };

  if (!diagnostics.requested) {
    setState("disabled");
    return {
      disconnect() {
        setState("disabled");
      }
    };
  }

  if (!diagnostics.enabled || diagnostics.targetLabel === "target not configured") {
    setState("unavailable");
    return {
      disconnect() {
        setState("unavailable");
      }
    };
  }

  const createSocket = options.webSocketFactory ?? createBrowserWebSocket;
  setState("connecting");
  const socket = createSocket(diagnostics.targetLabel);

  socket.addEventListener("open", () => setState("active"));
  socket.addEventListener("error", () => setState("unavailable"));
  socket.addEventListener("close", () => {
    if (currentState === "unavailable" || currentState === "degraded") {
      setState(currentState);
      return;
    }

    setState("inactive");
  });
  socket.addEventListener("message", (event) => {
    try {
      const raw = typeof event.data === "string" ? event.data : String(event.data);
      const payload = JSON.parse(raw) as unknown;
      if (isAlertLiveUpdateEvent(payload)) {
        options.onEvent(payload);
        return;
      }

      setState("degraded");
    } catch {
      setState("degraded");
    }
  });

  return {
    disconnect() {
      socket.close();
      setState("inactive");
    }
  };
}
