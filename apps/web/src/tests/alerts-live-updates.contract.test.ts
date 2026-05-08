import { describe, expect, it, vi } from "vitest";
import {
  getAlertsLiveUpdatesRuntimeDiagnostics,
  getAuthRuntimeDiagnostics,
  parseClientRuntimeConfig
} from "../clients/runtime-config";
import { deriveFrontendSessionBootstrap } from "../features/auth-session";
import { connectAlertsLiveUpdates } from "../features/alerts-live-updates";

class FakeWebSocket {
  private listeners = new Map<string, Array<(event?: { readonly data: unknown }) => void>>();

  constructor(public readonly url: string) {}

  addEventListener(type: "open", listener: () => void): void;
  addEventListener(type: "error", listener: () => void): void;
  addEventListener(type: "close", listener: () => void): void;
  addEventListener(type: "message", listener: (event: { readonly data: unknown }) => void): void;
  addEventListener(
    type: "open" | "error" | "close" | "message",
    listener: ((event?: { readonly data: unknown }) => void) | ((event: { readonly data: unknown }) => void)
  ) {
    const existing = this.listeners.get(type) ?? [];
    existing.push(listener as (event?: { readonly data: unknown }) => void);
    this.listeners.set(type, existing);
  }

  emit(type: "open" | "error" | "close" | "message", event?: { readonly data: unknown }) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }

  close() {
    this.emit("close");
  }
}

describe("Alerts live updates connector", () => {
  it("stays disabled by default and does not try to connect", () => {
    const onEvent = vi.fn();
    const onStateChange = vi.fn();
    const webSocketFactory = vi.fn();

    const connection = connectAlertsLiveUpdates({
      config: parseClientRuntimeConfig({}),
      onEvent,
      onStateChange,
      webSocketFactory
    });

    expect(onStateChange).toHaveBeenCalledWith("disabled");
    expect(onEvent).not.toHaveBeenCalled();
    expect(webSocketFactory).not.toHaveBeenCalled();

    connection.disconnect();
  });

  it("connects on the opt-in HTTP path and forwards stable alert events", () => {
    const states: string[] = [];
    const subscriptionStates: string[] = [];
    const events: unknown[] = [];
    let socket: FakeWebSocket | undefined;
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT: "direct",
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL: "http://localhost:4000",
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES: "true"
    });

    const connection = connectAlertsLiveUpdates({
      config,
      diagnostics: getAlertsLiveUpdatesRuntimeDiagnostics(config),
      onEvent: (event) => {
        events.push(event);
      },
      onStateChange: (state) => {
        states.push(state);
      },
      onSubscriptionStateChange: (state) => {
        subscriptionStates.push(state);
      },
      webSocketFactory: (url) => {
        socket = new FakeWebSocket(url);
        return socket;
      }
    });

    expect(socket?.url).toBe("ws://localhost:4000/ws/alerts");

    socket?.emit("open");
    socket?.emit("message", {
      data: JSON.stringify({
        source: "alerts_live_updates",
        kind: "subscription_status",
        timestamp: "2026-04-22T09:14:00.000Z",
        authMode: "disabled",
        subscriptionAuthState: "bypassed_local",
        message: "bypassed"
      })
    });
    socket?.emit("message", {
      data: JSON.stringify({
        source: "alerts",
        eventType: "alert_lifecycle_changed",
        timestamp: "2026-04-22T09:15:00.000Z",
        alertId: "alert-1"
      })
    });

    expect(states).toContain("connecting");
    expect(states).toContain("active");
    expect(subscriptionStates).toContain("bypassed_local");
    expect(events).toHaveLength(1);

    connection.disconnect();
  });

  it("fails safely when the live-update payload is malformed", () => {
    const states: string[] = [];
    let socket: FakeWebSocket | undefined;

    const connection = connectAlertsLiveUpdates({
      config: parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT: "direct",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL: "http://localhost:4000",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES: "true"
      }),
      onEvent: vi.fn(),
      onStateChange: (state) => {
        states.push(state);
      },
      webSocketFactory: (url) => {
        socket = new FakeWebSocket(url);
        return socket;
      }
    });

    socket?.emit("message", { data: "{not-json" });

    expect(states).toContain("degraded");

    connection.disconnect();
  });

  it("keeps connection failures distinct from degraded payload handling", () => {
    const states: string[] = [];
    let socket: FakeWebSocket | undefined;

    const connection = connectAlertsLiveUpdates({
      config: parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT: "direct",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL: "http://localhost:4000",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES: "true"
      }),
      onEvent: vi.fn(),
      onStateChange: (state) => {
        states.push(state);
      },
      webSocketFactory: (url) => {
        socket = new FakeWebSocket(url);
        return socket;
      }
    });

    socket?.emit("error");
    socket?.emit("close");

    expect(states).toContain("unavailable");
    expect(states.at(-1)).toBe("unavailable");

    connection.disconnect();
  });

  it("can connect through the local bootstrap route without a direct websocket auth env token", async () => {
    const states: string[] = [];
    const subscriptionStates: string[] = [];
    const events: unknown[] = [];
    let socket: FakeWebSocket | undefined;
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_SUBSCRIPTION_MODE: "proxy_bootstrap",
      NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE: "keycloak",
      NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL: "https://id.example.com/realms/aquapulse",
      NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM: "aquapulse",
      NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID: "aquapulse-web"
    });
    const auth = getAuthRuntimeDiagnostics(config, {
      forwardedAuthPresent: true,
      forwardingSource: "env_token"
    });
    const session = deriveFrontendSessionBootstrap(auth, {
      currentSession: {
        requestedMode: "keycloak",
        effectiveMode: "keycloak",
        availabilityState: "authenticated_user",
        authSource: "keycloak_bearer",
        sessionPresent: true,
        protectedReadSliceLabel: "alerts_list_read",
        protectedReadSliceEnforced: true,
        secondaryProtectedReadSliceLabel: "alerts_detail_read",
        secondaryProtectedReadSliceEnforced: true,
        tertiaryProtectedReadSliceLabel: "alerts_summary_read",
        tertiaryProtectedReadSliceEnforced: true,
        protectedOperatorSliceLabel: "alerts_lifecycle_actions",
        protectedOperatorSliceEnforced: true,
        secondaryProtectedSliceLabel: "alerts_triage_actions",
        secondaryProtectedSliceEnforced: true,
        tertiaryProtectedSliceLabel: "alerts_bulk_actions",
        tertiaryProtectedSliceEnforced: true,
        quaternaryProtectedSliceLabel: "alerts_saved_view_mutations",
        quaternaryProtectedSliceEnforced: true,
        nonAlertsOperatorAccessSummaryLabel: "non_alert_operator_update_access",
        nonAlertsOperatorAccessSummaryEnforced: true,
        nonAlertsProtectedSliceLabel: "tasks_update",
        nonAlertsProtectedSliceEnforced: true,
        secondaryNonAlertsProtectedSliceLabel: "feed_update",
        secondaryNonAlertsProtectedSliceEnforced: true,
        tertiaryNonAlertsProtectedSliceLabel: "ponds_update",
        tertiaryNonAlertsProtectedSliceEnforced: true,
        quaternaryNonAlertsProtectedSliceLabel: "water_quality_create",
        quaternaryNonAlertsProtectedSliceEnforced: true,
        verificationState: "verified",
        warnings: []
      },
      currentSessionEndpointStatus: "available"
    });
    const diagnostics = getAlertsLiveUpdatesRuntimeDiagnostics(config, { auth, session });

    const connection = connectAlertsLiveUpdates({
      config,
      diagnostics,
      onEvent: (event) => {
        events.push(event);
      },
      onStateChange: (state) => {
        states.push(state);
      },
      onSubscriptionStateChange: (state) => {
        subscriptionStates.push(state);
      },
      bootstrapFetch: vi.fn(async () =>
        new Response(
          JSON.stringify({
            ok: true,
            data: {
              requested: true,
              enabled: true,
              subscriptionTransport: "local_proxy_bootstrap",
              credentialMode: "ephemeral_ticket",
              targetLabel: "/api/alerts/live-updates/session",
              webSocketUrl: "ws://localhost:4000/ws/alerts?subscription_ticket=bootstrap-ticket",
              ticketIssued: true,
              ticketExpiresAt: "2026-04-22T09:16:00.000Z",
              subscriptionAuthState: "authenticated",
              authMode: "keycloak",
              forwardedAuthPresent: true,
              forwardingSource: "env_token",
              warnings: []
            }
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        )
      ),
      webSocketFactory: (url) => {
        socket = new FakeWebSocket(url);
        return socket;
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(socket?.url).toBe("ws://localhost:4000/ws/alerts?subscription_ticket=bootstrap-ticket");

    socket?.emit("open");
    socket?.emit("message", {
      data: JSON.stringify({
        source: "alerts_live_updates",
        kind: "subscription_status",
        timestamp: "2026-04-22T09:14:00.000Z",
        authMode: "keycloak",
        subscriptionAuthState: "authenticated",
        message: "authenticated"
      })
    });
    socket?.emit("message", {
      data: JSON.stringify({
        source: "alerts",
        eventType: "alert_lifecycle_changed",
        timestamp: "2026-04-22T09:15:00.000Z",
        alertId: "alert-1"
      })
    });

    expect(states).toContain("connecting");
    expect(states).toContain("active");
    expect(subscriptionStates).toContain("authenticated");
    expect(events).toHaveLength(1);

    connection.disconnect();
  });

  it("stays degraded instead of opening a websocket when keycloak auth is active without websocket auth config", () => {
    const states: string[] = [];
    const subscriptionStates: string[] = [];
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT: "direct",
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL: "http://localhost:4000",
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE: "keycloak",
      NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL: "https://id.example.com/realms/aquapulse",
      NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM: "aquapulse",
      NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID: "aquapulse-web"
    });
    const auth = getAuthRuntimeDiagnostics(config, {
      forwardedAuthPresent: true,
      forwardingSource: "env_token"
    });
    const session = deriveFrontendSessionBootstrap(auth);
    const diagnostics = getAlertsLiveUpdatesRuntimeDiagnostics(config, { auth, session });
    const webSocketFactory = vi.fn();

    const connection = connectAlertsLiveUpdates({
      config,
      diagnostics,
      onEvent: vi.fn(),
      onStateChange: (state) => {
        states.push(state);
      },
      onSubscriptionStateChange: (state) => {
        subscriptionStates.push(state);
      },
      webSocketFactory
    });

    expect(states).toContain("degraded");
    expect(subscriptionStates).toContain("degraded");
    expect(webSocketFactory).not.toHaveBeenCalled();

    connection.disconnect();
  });
});
