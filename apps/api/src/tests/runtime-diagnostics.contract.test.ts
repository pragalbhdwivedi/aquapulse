import { describe, expect, it } from "vitest";
import { DiagnosticsController } from "../diagnostics.controller";
import { HealthController } from "../health.controller";
import { RuntimeDiagnosticsService } from "../runtime-diagnostics.service";

describe("API runtime diagnostics", () => {
  it("builds a stable backend runtime diagnostics payload without requiring a live database", () => {
    const service = new RuntimeDiagnosticsService({
      env: {
        DATABASE_HOST: "db.internal",
        DATABASE_PORT: "5433",
        DATABASE_NAME: "aquapulse_api",
        DATABASE_SCHEMA: "public",
        DATABASE_SSL_MODE: "require",
        AQUAPULSE_PERSISTENCE_MODE: "postgres",
        AQUAPULSE_ENABLE_POSTGRES_ADAPTERS: "false"
      }
    });

    const diagnostics = service.getRuntimeDiagnostics();

    expect(diagnostics.service).toBe("api");
    expect(diagnostics.mode.defaultMode).toBe("in-memory");
    expect(diagnostics.mode.effectiveMode).toBe("in-memory");
    expect(diagnostics.database.host).toBe("db.internal");
    expect(diagnostics.database.configured).toBe(true);
    expect(diagnostics.database.connectivity.status).toBe("configured_only");
    expect(diagnostics.alerts.localBridgeExpectedPath).toBe("/api/alerts");
    expect(diagnostics.warnings.map((warning) => warning.code)).toContain("POSTGRES_DISABLED");
  });

  it("keeps health and runtime endpoints aligned through the shared diagnostics service", () => {
    const service = new RuntimeDiagnosticsService({
      env: {},
      now: () => "2026-04-16T00:00:00.000Z"
    });

    const diagnosticsController = new DiagnosticsController(service);
    const healthController = new HealthController(service);
    const runtime = diagnosticsController.getRuntimeDiagnostics();
    const health = healthController.getHealth();

    expect(health.ok).toBe(true);
    expect(health.service).toBe("api");
    expect(health.timestamp).toBe("2026-04-16T00:00:00.000Z");
    expect(health.runtime).toEqual(runtime);
    expect(health.status).toBe("degraded");
  });
});
