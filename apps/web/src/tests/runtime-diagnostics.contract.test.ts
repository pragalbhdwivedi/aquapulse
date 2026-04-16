import { describe, expect, it } from "vitest";
import { readFrontendRuntimeDiagnostics } from "../features/runtime-diagnostics";

describe("Frontend runtime diagnostics", () => {
  it("keeps default runtime on safe mock/in-memory assumptions", () => {
    const diagnostics = readFrontendRuntimeDiagnostics({});

    expect(diagnostics.service).toBe("web");
    expect(diagnostics.mode.effectiveMode).toBe("mock");
    expect(diagnostics.mode.safeFallbackActive).toBe(true);
    expect(diagnostics.alerts.effectiveMode).toBe("mock");
    expect(diagnostics.localBridge.backendTargetLabel).toBe("http://localhost:4000");
  });

  it("represents alerts-only HTTP proxy mode and bridge assumptions consistently", () => {
    const diagnostics = readFrontendRuntimeDiagnostics({
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      AQUAPULSE_WEB_LOCAL_API_BACKEND_URL: "http://localhost:4001"
    });

    expect(diagnostics.alerts.effectiveMode).toBe("http");
    expect(diagnostics.alerts.transport).toBe("proxy");
    expect(diagnostics.alerts.targetLabel).toBe("/api/alerts local bridge");
    expect(diagnostics.localBridge.backendTargetLabel).toBe("http://localhost:4001");
    expect(diagnostics.localBridge.configured).toBe(true);
  });
});
