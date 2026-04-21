import { Injectable } from "@nestjs/common";
import type {
  BackendHealthDiagnostics,
  BackendRuntimeDiagnostics,
  RuntimeConnectionCheckStatus,
  RuntimeModeSummary,
  RuntimeWarning
} from "@aquapulse/types";
import { resolvePersistenceSelection } from "@aquapulse/database";
import {
  readApiDatabaseRuntimeConfig,
  type ApiDatabaseRuntimeEnvSource
} from "./common/config/database-runtime.config";
import { getCachedAlertsLiveUpdatesGatewayState } from "./common/config/alerts-live-updates-cache";
import { getCachedDatabaseConnectionStatus } from "./common/config/database-connectivity-cache";
import { readAlertExplanationRuntimeConfig } from "./modules/ai/config/alert-explanation.config";
import {
  readAlertsLiveUpdatesRuntimeConfig,
  type AlertsLiveUpdatesRuntimeEnvSource
} from "./modules/alerts/live-updates/alerts-live-updates.config";

export interface RuntimeDiagnosticsServiceOptions {
  readonly env?: ApiDatabaseRuntimeEnvSource & AlertsLiveUpdatesRuntimeEnvSource;
  readonly now?: () => string;
  readonly version?: string;
}

@Injectable()
export class RuntimeDiagnosticsService {
  private readonly env: ApiDatabaseRuntimeEnvSource;
  private readonly now: () => string;
  private readonly version: string;

  constructor(options: RuntimeDiagnosticsServiceOptions = {}) {
    this.env = (options.env ?? process.env) as ApiDatabaseRuntimeEnvSource;
    this.now = options.now ?? (() => new Date().toISOString());
    this.version = options.version ?? "0.1.0";
  }

  getRuntimeDiagnostics(): BackendRuntimeDiagnostics {
    const runtime = readApiDatabaseRuntimeConfig(this.env);
    const alertExplanationRuntime = readAlertExplanationRuntimeConfig({ ...this.env });
    const alertsLiveUpdatesRuntime = readAlertsLiveUpdatesRuntimeConfig(
      this.env as ApiDatabaseRuntimeEnvSource & AlertsLiveUpdatesRuntimeEnvSource
    );
    const cachedAlertsLiveUpdatesState = getCachedAlertsLiveUpdatesGatewayState();
    const selection = resolvePersistenceSelection({
      defaultAdapter: "in-memory",
      requestedAdapter: runtime.persistence.requestedAdapter,
      allowRuntimeSwitch: false,
      postgresEnabled: runtime.persistence.postgresEnabled
    });
    const alertsSelection = resolvePersistenceSelection({
      defaultAdapter: "in-memory",
      requestedAdapter: runtime.persistence.requestedAdapter,
      allowRuntimeSwitch: true,
      postgresEnabled: runtime.persistence.postgresEnabled
    });
    const feedSelection = resolvePersistenceSelection({
      defaultAdapter: "in-memory",
      requestedAdapter: runtime.persistence.requestedAdapter,
      allowRuntimeSwitch: true,
      postgresEnabled: runtime.persistence.postgresEnabled
    });
    const tasksSelection = resolvePersistenceSelection({
      defaultAdapter: "in-memory",
      requestedAdapter: runtime.persistence.requestedAdapter,
      allowRuntimeSwitch: true,
      postgresEnabled: runtime.persistence.postgresEnabled
    });
    const waterQualitySelection = resolvePersistenceSelection({
      defaultAdapter: "in-memory",
      requestedAdapter: runtime.persistence.requestedAdapter,
      allowRuntimeSwitch: true,
      postgresEnabled: runtime.persistence.postgresEnabled
    });
    const warnings: RuntimeWarning[] = [];
    const alertWarnings: RuntimeWarning[] = [];
    const feedWarnings: RuntimeWarning[] = [];
    const tasksWarnings: RuntimeWarning[] = [];
    const waterQualityWarnings: RuntimeWarning[] = [];
    const cachedConnectionStatus = getCachedDatabaseConnectionStatus();
    const configured =
      Boolean(this.env.DATABASE_HOST) ||
      Boolean(this.env.DATABASE_NAME) ||
      Boolean(this.env.DATABASE_USER) ||
      Boolean(this.env.DATABASE_PASSWORD);
    const connectivityStatus: RuntimeConnectionCheckStatus =
      cachedConnectionStatus != null
        ? cachedConnectionStatus.ready
          ? "reachable"
          : "unreachable"
        : configured
          ? "configured_only"
          : "not_attempted";
    const connectivity =
      cachedConnectionStatus != null
        ? {
            status: connectivityStatus,
            message: cachedConnectionStatus.message
          }
        : {
            status: connectivityStatus,
            message: configured
              ? "Database configuration is present, but no live connectivity check was attempted."
              : "No explicit database configuration was supplied, and no live connectivity check was attempted."
          };

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

    if (runtime.persistence.requestedAdapter === "postgres" && !runtime.persistence.postgresEnabled) {
      alertWarnings.push({
        code: "ALERTS_POSTGRES_DISABLED",
        message:
          "Alerts Postgres cutover was requested, but AQUAPULSE_ENABLE_POSTGRES_ADAPTERS is not enabled. Alerts remain on the safe in-memory adapter."
      });
    }

    if (runtime.persistence.requestedAdapter === "postgres" && alertsSelection.adapter !== "postgres") {
      alertWarnings.push({
        code: "ALERTS_POSTGRES_BLOCKED",
        message:
          "Alerts requested the Postgres adapter, but the effective alerts adapter is still in-memory."
      });
    }

    if (alertsSelection.adapter === "postgres" && !configured) {
      alertWarnings.push({
        code: "ALERTS_POSTGRES_CONFIG_MISSING",
        message:
          "Alerts Postgres cutover is enabled, but database configuration is incomplete. The adapter selection is Postgres, but live connectivity has not been verified."
      });
    }

    if (runtime.persistence.requestedAdapter === "postgres" && !runtime.persistence.postgresEnabled) {
      feedWarnings.push({
        code: "FEED_POSTGRES_DISABLED",
        message:
          "Feed Postgres cutover was requested, but AQUAPULSE_ENABLE_POSTGRES_ADAPTERS is not enabled. Feed remains on the safe in-memory adapter."
      });
    }

    if (runtime.persistence.requestedAdapter === "postgres" && feedSelection.adapter !== "postgres") {
      feedWarnings.push({
        code: "FEED_POSTGRES_BLOCKED",
        message:
          "Feed requested the Postgres adapter, but the effective feed adapter is still in-memory."
      });
    }

    if (feedSelection.adapter === "postgres" && !configured) {
      feedWarnings.push({
        code: "FEED_POSTGRES_CONFIG_MISSING",
        message:
          "Feed Postgres cutover is enabled, but database configuration is incomplete. The adapter selection is Postgres, but live connectivity has not been verified."
      });
    }

    if (runtime.persistence.requestedAdapter === "postgres" && !runtime.persistence.postgresEnabled) {
      tasksWarnings.push({
        code: "TASKS_POSTGRES_DISABLED",
        message:
          "Tasks Postgres cutover was requested, but AQUAPULSE_ENABLE_POSTGRES_ADAPTERS is not enabled. Tasks remain on the safe in-memory adapter."
      });
    }

    if (runtime.persistence.requestedAdapter === "postgres" && tasksSelection.adapter !== "postgres") {
      tasksWarnings.push({
        code: "TASKS_POSTGRES_BLOCKED",
        message:
          "Tasks requested the Postgres adapter, but the effective tasks adapter is still in-memory."
      });
    }

    if (tasksSelection.adapter === "postgres" && !configured) {
      tasksWarnings.push({
        code: "TASKS_POSTGRES_CONFIG_MISSING",
        message:
          "Tasks Postgres cutover is enabled, but database configuration is incomplete. The adapter selection is Postgres, but live connectivity has not been verified."
      });
    }

    if (runtime.persistence.requestedAdapter === "postgres" && !runtime.persistence.postgresEnabled) {
      waterQualityWarnings.push({
        code: "WATER_QUALITY_POSTGRES_DISABLED",
        message:
          "Water-quality Postgres cutover was requested, but AQUAPULSE_ENABLE_POSTGRES_ADAPTERS is not enabled. Water-quality remains on the safe in-memory adapter."
      });
    }

    if (
      runtime.persistence.requestedAdapter === "postgres" &&
      waterQualitySelection.adapter !== "postgres"
    ) {
      waterQualityWarnings.push({
        code: "WATER_QUALITY_POSTGRES_BLOCKED",
        message:
          "Water-quality requested the Postgres adapter, but the effective water-quality adapter is still in-memory."
      });
    }

    if (waterQualitySelection.adapter === "postgres" && !configured) {
      waterQualityWarnings.push({
        code: "WATER_QUALITY_POSTGRES_CONFIG_MISSING",
        message:
          "Water-quality Postgres cutover is enabled, but database configuration is incomplete. The adapter selection is Postgres, but live connectivity has not been verified."
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
        connectivity
      },
      aiExplanations: {
        advisoryOnly: true,
        mode: alertExplanationRuntime.configured ? "openai_nano" : "fallback",
        configured: alertExplanationRuntime.configured,
        modelLabel: alertExplanationRuntime.modelLabel,
        cacheEnabled: true,
        attachmentAvailable: true,
        feedbackEnabled: true,
        warnings: alertExplanationRuntime.warnings
      },
      alerts: {
        workbenchCutoverAvailable: true,
        postgresReadCutoverAvailable: true,
        postgresWriteCutoverAvailable: true,
        requestedAdapter: runtime.persistence.requestedAdapter,
        effectiveAdapter: alertsSelection.adapter,
        runtimeSwitchEnabled: true,
        cutoverActive: alertsSelection.adapter === "postgres",
        databaseConfigured: configured,
        connectivityStatus: connectivity.status,
        localBridgeExpectedPath: "/api/alerts",
        localAiExplainBridgeExpectedPath: "/api/ai/alerts",
        warnings: alertWarnings
      },
      alertsLiveUpdates: {
        enabled: alertsLiveUpdatesRuntime.enabled,
        gatewayPath: alertsLiveUpdatesRuntime.path,
        gatewayAttached: cachedAlertsLiveUpdatesState?.gatewayAttached ?? false,
        activeConnections: cachedAlertsLiveUpdatesState?.activeConnections ?? 0,
        lastEventAt: cachedAlertsLiveUpdatesState?.lastEventAt,
        warnings: alertsLiveUpdatesRuntime.enabled
          ? [...alertsLiveUpdatesRuntime.warnings]
          : [
              ...alertsLiveUpdatesRuntime.warnings,
              {
                code: "ALERTS_LIVE_UPDATES_DISABLED",
                message:
                  "Alerts live updates are disabled by default. Enable AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES to attach the local websocket gateway."
              }
            ]
      },
      feed: {
        postgresReadCutoverAvailable: true,
        postgresWriteCutoverAvailable: true,
        requestedAdapter: runtime.persistence.requestedAdapter,
        effectiveAdapter: feedSelection.adapter,
        runtimeSwitchEnabled: true,
        cutoverActive: feedSelection.adapter === "postgres",
        databaseConfigured: configured,
        connectivityStatus: connectivity.status,
        localBridgeExpectedPath: "/api/feed",
        warnings: feedWarnings
      },
      tasks: {
        postgresReadCutoverAvailable: true,
        postgresWriteCutoverAvailable: true,
        requestedAdapter: runtime.persistence.requestedAdapter,
        effectiveAdapter: tasksSelection.adapter,
        runtimeSwitchEnabled: true,
        cutoverActive: tasksSelection.adapter === "postgres",
        databaseConfigured: configured,
        connectivityStatus: connectivity.status,
        warnings: tasksWarnings
      },
      waterQuality: {
        postgresReadCutoverAvailable: true,
        postgresWriteCutoverAvailable: true,
        requestedAdapter: runtime.persistence.requestedAdapter,
        effectiveAdapter: waterQualitySelection.adapter,
        runtimeSwitchEnabled: true,
        cutoverActive: waterQualitySelection.adapter === "postgres",
        databaseConfigured: configured,
        connectivityStatus: connectivity.status,
        warnings: waterQualityWarnings
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
