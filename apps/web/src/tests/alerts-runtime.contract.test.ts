import { describe, expect, it } from "vitest";
import { parseClientRuntimeConfig } from "../clients/runtime-config";
import {
  deriveAlertsRuntimeIndicator,
  formatAlertsRuntimeError
} from "../features/alerts-runtime";

describe("Alerts runtime helpers", () => {
  it("describes the local proxy runtime in a developer-friendly way", () => {
    const indicator = deriveAlertsRuntimeIndicator(
      parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true"
      })
    );

    expect(indicator.modeLabel).toBe("HTTP via local proxy");
    expect(indicator.targetLabel).toBe("/api/alerts local bridge");
  });

  it("formats HTTP runtime failures with proxy guidance", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true"
    });

    expect(formatAlertsRuntimeError(new Error("fetch failed"), config)).toContain(
      "local /api/alerts bridge"
    );
  });
});
