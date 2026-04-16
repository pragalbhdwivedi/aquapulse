import { Injectable } from "@nestjs/common";
import type {
  BackendHealthDiagnostics,
  BackendRuntimeDiagnostics,
  RuntimeModeSummary,
  RuntimeWarning
} from "@aquapulse/types";
import { resolvePersistenceSelection } from "@aquapulse/database";
import {
  readApiDatabaseRuntimeConfig,
  type ApiDatabaseRuntimeEnvSource
} from "./common/config/database-runtime.config";

export interface RuntimeDiagnosticsServiceOptions {
  readonly env?: ApiDatabaseRuntimeEnvSource;
  readonly now?: () => string;
  readonly version?: string;
}

@Injectable()
export class RuntimeDiagnosticsService {
  private readonly env: ApiDatabaseRuntimeEnvSource;
  private readonly now: () => string;
  private readonly version: string;

  constructor(options: RuntimeDiagnosticsServiceOptions = {}) {
    this.env = options.env ?? process.env;
    this.now = options.now ?? (() => new Date().toISOString());
    this.version = options.version ?? "0.1.0";
  }

  getRuntimeDiagnostics(): BackendRuntimeDiagnostics {
    const runtime = readApiDatabaseRuntimeConfig(this.env);
    const selection = resolvePersistenceSelection({
      defaultAdapter: "in-memory",
      requestedAdapter: runtime.persistence.requestedAdapter,
      allowRuntimeSwitch: false,
      postgresEnabled: runtime.persistence.postgresEnabled
    });
    const warnings: RuntimeWarning[] = [];
    const configured =
      Boolean(this.env.DATABASE_HOST) ||
      Boolean(this.env.DATABASE_NAME) ||
      Boolean(this.env.DATABASE_USER) ||
      Boolean(this.env.DATABASE_PASSWORD);

    if (runtime.persistence.requestedAdapter === "postgres" && !runtime.persistence.postgresEnabled) {
      warnings.push({
        code: "POSTGRES_DISABLED",
        message:
          "Postgres persistence was requested, but AQUAPULSE_ENABLE_POSTGRES_ADAPTERS is not enabled. The API remains on the safe in-memory path."
      });
    }

    if (runtime.persistence.requestedAdapter === "postgres" && selection.adapter !== "postgres") {
      warnings.push({
        code: "RUNTIME_SWITCH_BLOCKED",
        message:
          "A Postgres adapter was requested, but runtime switching is still blocked by default in this stage."
      });
    }

    if (!configured) {
      warnings.push({
        code: "DATABASE_CONFIG_DEFAULTS",
        message:
          "Database env was not explicitly configured. The diagnostics payload is showing safe defaults only."
      });
    }

    const mode: RuntimeModeSummary = {
      defaultMode: "in-memory",
      requestedMode: runtime.persistence.requestedAdapter,
      effectiveMode: selection.adapter,
      safeFallbackActive: selection.adapter === "in-memory"
    };

    return {
      service: "api",
      mode,
      database: {
        configured,
        selectedAdapter: selection.adapter,
        requestedAdapter: runtime.persistence.requestedAdapter,
        postgresAdaptersEnabled: Boolean(runtime.persistence.postgresEnabled),
        runtimeSwitchEnabled: false,
        schema: runtime.database.schema,
        host: runtime.database.host,
        port: runtime.database.port,
        database: runtime.database.database,
        sslMode: runtime.database.sslMode,
        healthcheckOnBoot: runtime.healthcheckOnBoot,
        connectivity: {
          status: configured ? "configured_only" : "not_attempted",
          message: configured
            ? "Database configuration is present, but no live connectivity check was attempted."
            : "No explicit database configuration was supplied, and no live connectivity check was attempted."
        }
      },
      alerts: {
        workbenchCutoverAvailable: true,
        postgresReadCutoverAvailable: true,
        postgresWriteCutoverAvailable: true,
        localBridgeExpectedPath: "/api/alerts"
      },
      warnings
    };
  }

  getHealthDiagnostics(): BackendHealthDiagnostics {
    const runtime = this.getRuntimeDiagnostics();

    return {
      ok: true,
      status: runtime.warnings.length > 0 ? "degraded" : "ok",
      service: "api",
      version: this.version,
      timestamp: this.now(),
      runtime
    };
  }
}
