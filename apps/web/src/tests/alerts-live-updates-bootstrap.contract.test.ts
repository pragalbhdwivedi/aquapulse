import { describe, expect, it } from "vitest";
import { GET as bootstrapGet } from "../../app/api/alerts/live-updates/session/route";
import { createAlertsLiveUpdatesBootstrapEnvelope } from "../server/alerts-live-updates-bootstrap";

describe("Alerts live updates bootstrap", () => {
  it("stays disabled by default and keeps the safe local bootstrap target shape", () => {
    const envelope = createAlertsLiveUpdatesBootstrapEnvelope(
      new Request("http://localhost:3000/api/alerts/live-updates/session")
    );

    expect(envelope.ok).toBe(true);
    expect(envelope.data.requested).toBe(false);
    expect(envelope.data.enabled).toBe(false);
    expect(envelope.data.subscriptionTransport).toBe("local_proxy_bootstrap");
    expect(envelope.data.subscriptionAuthState).toBe("disabled");
    expect(envelope.data.webSocketUrl).toBeUndefined();
  });

  it("derives a local proxy bootstrap websocket target and forwarded auth token for keycloak mode", () => {
    const envelope = createAlertsLiveUpdatesBootstrapEnvelope(
      new Request("http://localhost:3000/api/alerts/live-updates/session"),
      {
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES: "true",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_SUBSCRIPTION_MODE: "proxy_bootstrap",
        NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE: "keycloak",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL: "https://id.example.com/realms/aquapulse",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM: "aquapulse",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID: "aquapulse-web",
        AQUAPULSE_WEB_LOCAL_API_BACKEND_URL: "http://localhost:4000",
        AQUAPULSE_WEB_AUTH_BEARER_TOKEN: "bootstrap-token"
      }
    );

    expect(envelope.data.enabled).toBe(true);
    expect(envelope.data.subscriptionTransport).toBe("local_proxy_bootstrap");
    expect(envelope.data.subscriptionAuthState).toBe("authenticated");
    expect(envelope.data.forwardedAuthPresent).toBe(true);
    expect(envelope.data.forwardingSource).toBe("env_token");
    expect(envelope.data.webSocketUrl).toBe("ws://localhost:4000/ws/alerts?access_token=bootstrap-token");
  });

  it("returns a degraded bootstrap state when keycloak mode lacks forwardable auth", () => {
    const envelope = createAlertsLiveUpdatesBootstrapEnvelope(
      new Request("http://localhost:3000/api/alerts/live-updates/session"),
      {
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES: "true",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_SUBSCRIPTION_MODE: "proxy_bootstrap",
        NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE: "keycloak",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL: "https://id.example.com/realms/aquapulse",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM: "aquapulse",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID: "aquapulse-web",
        AQUAPULSE_WEB_LOCAL_API_BACKEND_URL: "http://localhost:4000"
      }
    );

    expect(envelope.data.subscriptionAuthState).toBe("degraded");
    expect(envelope.data.webSocketUrl).toBeUndefined();
    expect(envelope.data.warnings.map((warning) => warning.code)).toContain(
      "ALERTS_LIVE_UPDATES_PROXY_FORWARDING_UNAVAILABLE"
    );
  });

  it("exposes the bootstrap route through the Next local bridge", async () => {
    const response = await bootstrapGet(
      new Request("http://localhost:3000/api/alerts/live-updates/session")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect((await response.json()).ok).toBe(true);
  });
});
