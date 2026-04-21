import { describe, expect, it } from "vitest";
import {
  deriveAlertsLiveUpdatesWebSocketUrl,
  readAlertsLiveUpdatesVerificationConfig
} from "../../../../scripts/lib/alerts-live-updates-runtime-verifier.mjs";

describe("Alerts live-updates runtime verifier", () => {
  it("keeps local verifier defaults bounded and local-development-safe", () => {
    const config = readAlertsLiveUpdatesVerificationConfig({});

    expect(config.webBaseUrl).toBe("http://localhost:3000");
    expect(config.backendBaseUrl).toBe("http://localhost:4000");
    expect(config.expectEnabled).toBe(true);
    expect(config.alertId).toBe("alert-1");
    expect(config.mutationPath).toBe("review-state");
  });

  it("derives a websocket verifier target from backend runtime diagnostics when none is set", () => {
    const url = deriveAlertsLiveUpdatesWebSocketUrl({
      backendBaseUrl: "http://localhost:4000",
      gatewayPath: "/ws/alerts"
    });

    expect(url).toBe("ws://localhost:4000/ws/alerts");
  });

  it("prefers an explicitly configured websocket verifier target", () => {
    const url = deriveAlertsLiveUpdatesWebSocketUrl({
      backendBaseUrl: "http://localhost:4000",
      gatewayPath: "/ws/alerts",
      explicitWebSocketUrl: "wss://alerts.example.com/ws/alerts"
    });

    expect(url).toBe("wss://alerts.example.com/ws/alerts");
  });
});
