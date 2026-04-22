import { describe, expect, it } from "vitest";
import {
  derivePondsRuntimeIndicator,
  formatPondsRuntimeError
} from "../features/ponds-runtime";
import { parseClientRuntimeConfig } from "../clients/runtime-config";

describe("Ponds runtime helpers", () => {
  it("derives mock runtime by default", () => {
    const config = parseClientRuntimeConfig({});
    const indicator = derivePondsRuntimeIndicator(config);

    expect(indicator.modeLabel).toBe("Mock");
    expect(indicator.targetLabel).toBe("mock adapters");
  });

  it("derives proxy HTTP runtime when ponds-only HTTP mode is enabled", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_MODE: "http"
    });
    const indicator = derivePondsRuntimeIndicator(config);

    expect(indicator.modeLabel).toBe("HTTP via local proxy");
    expect(indicator.targetLabel).toBe("/api/ponds local bridge");
  });

  it("formats ponds runtime failures with proxy guidance when applicable", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_MODE: "http"
    });

    expect(formatPondsRuntimeError(new Error("connect ECONNREFUSED"), config)).toContain(
      "/api/ponds bridge"
    );
  });
});
