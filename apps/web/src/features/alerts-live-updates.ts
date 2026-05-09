import type {
  AlertLiveUpdateEvent,
  AlertsLiveUpdatesSubscriptionAuthState,
  AlertsLiveUpdatesSubscriptionStatus,
  AlertsLiveUpdatesConnectionState,
  AlertsLiveUpdatesRuntimeDiagnostics
} from "@aquapulse/types";
import type { AquaPulseClientRuntimeConfig } from "@web/clients/runtime-config";
import {
  getAlertsLiveUpdatesRuntimeDiagnostics,
  isAlertsLiveUpdatesBootstrapEnvelope
} from "@web/clients/runtime-config";

export interface AlertsLiveUpdatesConnection {
  disconnect(): void;
}

export interface AlertsLiveUpdatesStateDescription {
  readonly label: string;
  readonly helperText: string;
}

export interface AlertsLiveUpdatesConnectorOptions {
  readonly config: AquaPulseClientRuntimeConfig;
  readonly diagnostics?: AlertsLiveUpdatesRuntimeDiagnostics;
  readonly onEvent: (event: AlertLiveUpdateEvent) => void;
  readonly onStateChange?: (state: AlertsLiveUpdatesConnectionState) => void;
  readonly onSubscriptionStateChange?: (state: AlertsLiveUpdatesSubscriptionAuthState) => void;
  readonly webSocketFactory?: (url: string) => WebSocketLike;
  readonly bootstrapFetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
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

function isAlertsLiveUpdatesSubscriptionStatus(
  value: unknown
): value is AlertsLiveUpdatesSubscriptionStatus {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AlertsLiveUpdatesSubscriptionStatus>;
  return (
    candidate.source === "alerts_live_updates" &&
    candidate.kind === "subscription_status" &&
    (candidate.subscriptionAuthState === "authenticated" ||
      candidate.subscriptionAuthState === "bypassed_local")
  );
}

function buildAlertsLiveUpdatesTargetUrl(config: AquaPulseClientRuntimeConfig, targetLabel: string): string {
  if (config.alertsLiveUpdatesAuthToken) {
    const url = new URL(targetLabel);
    url.searchParams.set("access_token", config.alertsLiveUpdatesAuthToken);
    return url.toString();
  }

  return targetLabel;
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
  const diagnostics = options.diagnostics ?? deriveAlertsLiveUpdatesIndicator(options.config);
  const onStateChange = options.onStateChange ?? (() => undefined);
  const onSubscriptionStateChange = options.onSubscriptionStateChange ?? (() => undefined);
  const bootstrapFetch = options.bootstrapFetch ?? fetch;
  let currentState: AlertsLiveUpdatesConnectionState = diagnostics.connectionState;
  let currentSubscriptionState: AlertsLiveUpdatesSubscriptionAuthState =
    diagnostics.subscriptionAuthState;
  let disconnected = false;
  let socket: WebSocketLike | undefined;
  const setState = (state: AlertsLiveUpdatesConnectionState) => {
    currentState = state;
    onStateChange(state);
  };
  const setSubscriptionState = (state: AlertsLiveUpdatesSubscriptionAuthState) => {
    currentSubscriptionState = state;
    onSubscriptionStateChange(state);
  };

  const attachSocket = (targetUrl: string) => {
    if (disconnected) {
      return;
    }

    const createSocket = options.webSocketFactory ?? createBrowserWebSocket;
    socket = createSocket(targetUrl);

    socket.addEventListener("open", () => {
      setState("active");
      setSubscriptionState(currentSubscriptionState);
    });
    socket.addEventListener("error", () => {
      setState("unavailable");
      setSubscriptionState("unavailable");
    });
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

        if (isAlertsLiveUpdatesSubscriptionStatus(payload)) {
          setSubscriptionState(payload.subscriptionAuthState);
          return;
        }

        setState("degraded");
        setSubscriptionState("degraded");
      } catch {
        setState("degraded");
        setSubscriptionState("degraded");
      }
    });
  };

  if (!diagnostics.requested) {
    setState("disabled");
    setSubscriptionState("disabled");
    return {
      disconnect() {
        disconnected = true;
        setState("disabled");
        setSubscriptionState("disabled");
      }
    };
  }

  if (!diagnostics.enabled || diagnostics.targetLabel === "target not configured") {
    setState("unavailable");
    setSubscriptionState("unavailable");
    return {
      disconnect() {
        disconnected = true;
        setState("unavailable");
        setSubscriptionState("unavailable");
      }
    };
  }

  if (diagnostics.subscriptionAuthState === "degraded") {
    setState("degraded");
    setSubscriptionState("degraded");
    return {
      disconnect() {
        disconnected = true;
        setState("degraded");
        setSubscriptionState("degraded");
      }
    };
  }

  setState("connecting");
  setSubscriptionState(diagnostics.subscriptionAuthState);

  if (diagnostics.subscriptionTransport === "local_proxy_bootstrap") {
    const bootstrapPath =
      diagnostics.proxyBootstrapPathLabel ??
      options.config.alertsLiveUpdatesBootstrapPath ??
      "/api/alerts/live-updates/session";

    void bootstrapFetch(bootstrapPath, {
      method: "GET",
      headers: {
        accept: "application/json"
      }
    })
      .then(async (response) => {
        const payload = (await response.json()) as unknown;
        if (!response.ok || !isAlertsLiveUpdatesBootstrapEnvelope(payload)) {
          throw new Error("Alerts live updates bootstrap endpoint returned an unexpected response.");
        }

        const bootstrap = payload.data;
        setSubscriptionState(bootstrap.subscriptionAuthState);

        if (
          !bootstrap.webSocketUrl ||
          bootstrap.subscriptionAuthState === "degraded" ||
          bootstrap.subscriptionAuthState === "unavailable" ||
          bootstrap.subscriptionAuthState === "disabled"
        ) {
          setState(
            bootstrap.subscriptionAuthState === "degraded"
              ? "degraded"
              : bootstrap.subscriptionAuthState === "disabled"
                ? "disabled"
                : "unavailable"
          );
          return;
        }

        attachSocket(bootstrap.webSocketUrl);
      })
      .catch(() => {
        setState("unavailable");
        setSubscriptionState("unavailable");
      });
  } else {
    attachSocket(buildAlertsLiveUpdatesTargetUrl(options.config, diagnostics.targetLabel));
  }

  return {
    disconnect() {
      disconnected = true;
      socket?.close();
      setState("inactive");
      setSubscriptionState(diagnostics.subscriptionAuthState);
    }
  };
}
