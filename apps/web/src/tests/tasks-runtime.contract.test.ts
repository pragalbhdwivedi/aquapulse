import { describe, expect, it } from "vitest";
import {
  deriveTasksRuntimeIndicator,
  formatTasksRuntimeError
} from "../features/tasks-runtime";
import { parseClientRuntimeConfig } from "../clients/runtime-config";

describe("Tasks runtime helpers", () => {
  it("derives mock runtime by default", () => {
    const config = parseClientRuntimeConfig({});
    const indicator = deriveTasksRuntimeIndicator(config);

    expect(indicator.modeLabel).toBe("Mock");
    expect(indicator.targetLabel).toBe("mock adapters");
  });

  it("derives proxy HTTP runtime when tasks-only HTTP mode is enabled", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_MODE: "http"
    });
    const indicator = deriveTasksRuntimeIndicator(config);

    expect(indicator.modeLabel).toBe("HTTP via local proxy");
    expect(indicator.targetLabel).toBe("/api/tasks local bridge");
  });

  it("formats tasks runtime failures with proxy guidance when applicable", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_MODE: "http"
    });

    expect(formatTasksRuntimeError(new Error("connect ECONNREFUSED"), config)).toContain(
      "/api/tasks bridge"
    );
  });
});
