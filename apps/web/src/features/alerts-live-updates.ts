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

export function connectAlertsLiveUpdates(
  options: AlertsLiveUpdatesConnectorOptions
): AlertsLiveUpdatesConnection {
  const diagnostics = deriveAlertsLiveUpdatesIndicator(options.config);
  const onStateChange = options.onStateChange ?? (() => undefined);

  if (!diagnostics.requested) {
    onStateChange("disabled");
    return {
      disconnect() {
        onStateChange("disabled");
      }
    };
  }

  if (!diagnostics.enabled || diagnostics.targetLabel === "target not configured") {
    onStateChange("unavailable");
    return {
      disconnect() {
        onStateChange("unavailable");
      }
    };
  }

  const createSocket = options.webSocketFactory ?? createBrowserWebSocket;
  onStateChange("connecting");
  const socket = createSocket(diagnostics.targetLabel);

  socket.addEventListener("open", () => onStateChange("active"));
  socket.addEventListener("error", () => onStateChange("unavailable"));
  socket.addEventListener("close", () => onStateChange("inactive"));
  socket.addEventListener("message", (event) => {
    try {
      const raw = typeof event.data === "string" ? event.data : String(event.data);
      const payload = JSON.parse(raw) as unknown;
      if (isAlertLiveUpdateEvent(payload)) {
        options.onEvent(payload);
      }
    } catch {
      onStateChange("unavailable");
    }
  });

  return {
    disconnect() {
      socket.close();
      onStateChange("inactive");
    }
  };
}
