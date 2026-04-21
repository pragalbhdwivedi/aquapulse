import { describe, expect, it } from "vitest";
import { setCachedDatabaseConnectionStatus } from "../common/config/database-connectivity-cache";
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
    expect(diagnostics.aiExplanations.mode).toBe("fallback");
    expect(diagnostics.aiExplanations.configured).toBe(false);
    expect(diagnostics.alerts.localBridgeExpectedPath).toBe("/api/alerts");
    expect(diagnostics.alerts.localAiExplainBridgeExpectedPath).toBe("/api/ai/alerts");
    expect(diagnostics.alerts.requestedAdapter).toBe("postgres");
    expect(diagnostics.alerts.effectiveAdapter).toBe("in-memory");
    expect(diagnostics.alerts.cutoverActive).toBe(false);
    expect(diagnostics.alerts.connectivityStatus).toBe("configured_only");
    expect(diagnostics.warnings.map((warning) => warning.code)).toContain("POSTGRES_DISABLED");
    expect(diagnostics.alerts.warnings.map((warning) => warning.code)).toContain(
      "ALERTS_POSTGRES_DISABLED"
    );
  });

  it("shows alerts cutover as active when Postgres adapters are enabled for the alerts module", () => {
    const service = new RuntimeDiagnosticsService({
      env: {
        DATABASE_HOST: "db.internal",
        DATABASE_NAME: "aquapulse_api",
        AQUAPULSE_PERSISTENCE_MODE: "postgres",
        AQUAPULSE_ENABLE_POSTGRES_ADAPTERS: "true"
      }
    });

    const diagnostics = service.getRuntimeDiagnostics();

    expect(diagnostics.mode.effectiveMode).toBe("in-memory");
    expect(diagnostics.alerts.effectiveAdapter).toBe("postgres");
    expect(diagnostics.alerts.cutoverActive).toBe(true);
    expect(diagnostics.alerts.databaseConfigured).toBe(true);
    expect(diagnostics.alerts.runtimeSwitchEnabled).toBe(true);
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

  it("surfaces cached DB connectivity when the boot-time healthcheck has run", () => {
    setCachedDatabaseConnectionStatus({
      ready: true,
      message: "Database connectivity check succeeded.",
      checkedAt: "2026-04-21T00:00:00.000Z"
    });

    const service = new RuntimeDiagnosticsService({
      env: {
        DATABASE_HOST: "localhost",
        DATABASE_NAME: "aquapulse",
        AQUAPULSE_PERSISTENCE_MODE: "postgres",
        AQUAPULSE_ENABLE_POSTGRES_ADAPTERS: "true",
        AQUAPULSE_DB_HEALTHCHECK_ON_BOOT: "true"
      }
    });

    const diagnostics = service.getRuntimeDiagnostics();

    expect(diagnostics.database.connectivity.status).toBe("reachable");
    expect(diagnostics.alerts.connectivityStatus).toBe("reachable");

    setCachedDatabaseConnectionStatus(undefined);
  });
});
