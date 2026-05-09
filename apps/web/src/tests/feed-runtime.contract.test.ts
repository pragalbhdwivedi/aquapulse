import { describe, expect, it } from "vitest";
import { parseClientRuntimeConfig } from "../clients/runtime-config";
import {
  deriveFeedRuntimeIndicator,
  formatFeedRuntimeError
} from "../features/feed-runtime";

describe("Feed runtime helpers", () => {
  it("describes the local proxy runtime in a developer-friendly way", () => {
    const indicator = deriveFeedRuntimeIndicator(
      parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE: "http",
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true"
      })
    );

    expect(indicator.modeLabel).toBe("HTTP via local proxy");
    expect(indicator.targetLabel).toBe("/api/feed local bridge");
  });

  it("formats HTTP runtime failures with proxy guidance", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true"
    });

    expect(formatFeedRuntimeError(new Error("fetch failed"), config)).toContain(
      "local /api/feed bridge"
    );
  });
});
