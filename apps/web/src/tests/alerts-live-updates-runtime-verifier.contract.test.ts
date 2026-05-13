import { describe, expect, it } from "vitest";
// @ts-ignore Shared repo-level verifier helper is plain .mjs runtime code.
import { deriveAlertsLiveUpdatesWebSocketUrl, readAlertsLiveUpdatesVerificationConfig } from "../../../../scripts/lib/alerts-live-updates-runtime-verifier.mjs";

const verifierEnv = (overrides: Partial<NodeJS.ProcessEnv> = {}) =>
  ({
    NODE_ENV: "test",
    ...overrides
  }) as NodeJS.ProcessEnv;

const verifierTarget = (
  overrides: Partial<{
    backendBaseUrl: string;
    gatewayPath: string;
    explicitWebSocketUrl: string;
    bearerToken: string;
  }> = {}
) => ({
  backendBaseUrl: "http://localhost:4000",
  gatewayPath: "/ws/alerts",
  explicitWebSocketUrl: undefined,
  bearerToken: undefined,
  ...overrides
});

describe("Alerts live-updates runtime verifier", () => {
  it("keeps local verifier defaults bounded and local-development-safe", () => {
    const config = readAlertsLiveUpdatesVerificationConfig(verifierEnv());

    expect(config.webBaseUrl).toBe("http://localhost:3000");
    expect(config.backendBaseUrl).toBe("http://localhost:4000");
    expect(config.subscriptionMode).toBe("auto");
    expect(config.bootstrapEndpoint).toBe("http://localhost:3000/api/alerts/live-updates/session");
    expect(config.expectEnabled).toBe(true);
    expect(config.alertId).toBe("alert-1");
    expect(config.mutationPath).toBe("review-state");
  });

  it("derives a websocket verifier target from backend runtime diagnostics when none is set", () => {
    const url = deriveAlertsLiveUpdatesWebSocketUrl(verifierTarget());

    expect(url).toBe("ws://localhost:4000/ws/alerts");
  });

  it("prefers an explicitly configured websocket verifier target", () => {
    const url = deriveAlertsLiveUpdatesWebSocketUrl(verifierTarget({
      explicitWebSocketUrl: "wss://alerts.example.com/ws/alerts"
    }));

    expect(url).toBe("wss://alerts.example.com/ws/alerts");
  });

  it("appends a bounded bearer token to the websocket verifier target when provided", () => {
    const url = deriveAlertsLiveUpdatesWebSocketUrl(verifierTarget({
      bearerToken: "verifier-token"
    }));

    expect(url).toBe("ws://localhost:4000/ws/alerts?access_token=verifier-token");
  });

  it("supports the bounded local proxy bootstrap verifier mode", () => {
    const config = readAlertsLiveUpdatesVerificationConfig(verifierEnv({
      AQUAPULSE_ALERTS_LIVE_VERIFY_WS_SUBSCRIPTION_MODE: "proxy_bootstrap",
      AQUAPULSE_ALERTS_VERIFY_WEB_BASE_URL: "http://localhost:3100"
    }));

    expect(config.subscriptionMode).toBe("local_proxy_bootstrap");
    expect(config.bootstrapEndpoint).toBe("http://localhost:3100/api/alerts/live-updates/session");
  });
});
