import { Injectable } from "@nestjs/common";
import type {
  BackendAuthRuntimeDiagnostics,
  BackendHealthDiagnostics,
  BackendRuntimeDiagnostics,
  RuntimeConnectionCheckStatus,
  RuntimeModeSummary,
  RuntimeWarning
} from "@aquapulse/types";
import { resolvePersistenceSelection } from "@aquapulse/database";
import {
  readApiAuthRuntimeConfig,
  type ApiAuthRuntimeEnvSource
} from "./common/auth/auth-runtime.config";
import { getCachedKeycloakVerificationState } from "./common/auth/keycloak-verification-cache";
import {
  readApiDatabaseRuntimeConfig,
  type ApiDatabaseRuntimeEnvSource
} from "./common/config/database-runtime.config";
import { getCachedAlertsLiveUpdatesGatewayState } from "./common/config/alerts-live-updates-cache";
import { getCachedDatabaseConnectionStatus } from "./common/config/database-connectivity-cache";
import { readAlertExplanationRuntimeConfig } from "./modules/ai/config/alert-explanation.config";
import {
  readOperatorAssistanceRuntimeConfig,
  type OperatorAssistanceRuntimeEnv
} from "./modules/ai/config/operator-assistance.config";
import {
  readAlertsLiveUpdatesRuntimeConfig,
  type AlertsLiveUpdatesRuntimeEnvSource
} from "./modules/alerts/live-updates/alerts-live-updates.config";

export interface RuntimeDiagnosticsServiceOptions {
  readonly env?: ApiDatabaseRuntimeEnvSource &
    AlertsLiveUpdatesRuntimeEnvSource &
    ApiAuthRuntimeEnvSource &
    OperatorAssistanceRuntimeEnv;
  readonly now?: () => string;
  readonly version?: string;
}

@Injectable()
export class RuntimeDiagnosticsService {
  private readonly env: ApiDatabaseRuntimeEnvSource &
    AlertsLiveUpdatesRuntimeEnvSource &
    ApiAuthRuntimeEnvSource &
    OperatorAssistanceRuntimeEnv;
  private readonly now: () => string;
  private readonly version: string;

  constructor(options: RuntimeDiagnosticsServiceOptions = {}) {
    this.env = (options.env ?? process.env) as ApiDatabaseRuntimeEnvSource &
      AlertsLiveUpdatesRuntimeEnvSource &
      ApiAuthRuntimeEnvSource &
      OperatorAssistanceRuntimeEnv;
    this.now = options.now ?? (() => new Date().toISOString());
    this.version = options.version ?? "0.1.0";
  }

  getRuntimeDiagnostics(): BackendRuntimeDiagnostics {
    const authRuntime = readApiAuthRuntimeConfig(this.env);
    const cachedKeycloakVerification = getCachedKeycloakVerificationState();
    const runtime = readApiDatabaseRuntimeConfig(this.env);
    const alertExplanationRuntime = readAlertExplanationRuntimeConfig({ ...this.env });
    const operatorAssistanceRuntime = readOperatorAssistanceRuntimeConfig({ ...this.env });
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
    const pondsSelection = resolvePersistenceSelection({
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
    const pondsWarnings: RuntimeWarning[] = [];
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
      pondsWarnings.push({
        code: "PONDS_POSTGRES_DISABLED",
        message:
          "Ponds Postgres cutover was requested, but AQUAPULSE_ENABLE_POSTGRES_ADAPTERS is not enabled. Ponds remain on the safe in-memory adapter."
      });
    }

    if (runtime.persistence.requestedAdapter === "postgres" && pondsSelection.adapter !== "postgres") {
      pondsWarnings.push({
        code: "PONDS_POSTGRES_BLOCKED",
        message:
          "Ponds requested the Postgres adapter, but the effective ponds adapter is still in-memory."
      });
    }

    if (pondsSelection.adapter === "postgres" && !configured) {
      pondsWarnings.push({
        code: "PONDS_POSTGRES_CONFIG_MISSING",
        message:
          "Ponds Postgres cutover is enabled, but database configuration is incomplete. The adapter selection is Postgres, but live connectivity has not been verified."
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

    const authWarnings: RuntimeWarning[] = [...authRuntime.warnings];
    const authDiagnostics: BackendAuthRuntimeDiagnostics = {
      requestedMode: authRuntime.requestedMode,
      effectiveMode: authRuntime.effectiveMode,
      active: authRuntime.effectiveMode === "keycloak",
      bypassActive: authRuntime.effectiveMode !== "keycloak",
      keycloakConfigured: authRuntime.keycloak.configured,
      verificationAvailable: authRuntime.keycloak.verificationAvailable,
      verificationActive: authRuntime.effectiveMode === "keycloak",
      verificationBypassed: authRuntime.effectiveMode !== "keycloak",
      issuerLabel: authRuntime.keycloak.issuerUrl ?? "not configured",
      jwksLabel: authRuntime.keycloak.jwksUrl ?? "not configured",
      realm: authRuntime.keycloak.realm,
      clientId: authRuntime.keycloak.clientId,
      validationStrategy:
        authRuntime.effectiveMode === "keycloak"
          ? "keycloak_bearer_claims"
          : authRuntime.effectiveMode === "local"
            ? "local_headers"
            : "disabled",
      tokenValidation:
        authRuntime.effectiveMode !== "keycloak"
          ? "not_applicable"
          : cachedKeycloakVerification?.status === "verified"
            ? "verified"
            : authRuntime.keycloak.verificationAvailable
              ? "jwks_ready"
              : "verification_failed",
      verificationStatus:
        authRuntime.effectiveMode === "disabled"
          ? "disabled"
          : authRuntime.effectiveMode === "local"
            ? "local_bypass"
            : !authRuntime.keycloak.verificationAvailable
              ? "not_configured"
              : cachedKeycloakVerification?.status === "verified"
                ? "verified"
                : cachedKeycloakVerification?.status === "degraded"
                  ? "degraded"
                  : "ready",
      lastVerificationAt: cachedKeycloakVerification?.checkedAt,
      lastVerificationMessage: cachedKeycloakVerification?.message,
      firstProtectedSliceLabel: "runtime_diagnostics_api",
      firstProtectedSliceEnforced: authRuntime.effectiveMode === "keycloak",
      protectedReadSliceLabel: "alerts_list_read",
      protectedReadSliceEnforced: authRuntime.effectiveMode === "keycloak",
      secondaryProtectedReadSliceLabel: "alerts_detail_read",
      secondaryProtectedReadSliceEnforced: authRuntime.effectiveMode === "keycloak",
      tertiaryProtectedReadSliceLabel: "alerts_summary_read",
      tertiaryProtectedReadSliceEnforced: authRuntime.effectiveMode === "keycloak",
      protectedOperatorSliceLabel: "alerts_lifecycle_actions",
      protectedOperatorSliceEnforced: authRuntime.effectiveMode === "keycloak",
      secondaryProtectedSliceLabel: "alerts_triage_actions",
      secondaryProtectedSliceEnforced: authRuntime.effectiveMode === "keycloak",
      tertiaryProtectedSliceLabel: "alerts_bulk_actions",
      tertiaryProtectedSliceEnforced: authRuntime.effectiveMode === "keycloak",
      quaternaryProtectedSliceLabel: "alerts_saved_view_mutations",
      quaternaryProtectedSliceEnforced: authRuntime.effectiveMode === "keycloak",
      nonAlertsOperatorAccessSummaryLabel: "non_alert_operator_update_access",
      nonAlertsOperatorAccessSummaryEnforced: authRuntime.effectiveMode === "keycloak",
      nonAlertsReadAccessSummaryLabel: "non_alert_read_access",
      nonAlertsReadAccessSummaryEnforced: authRuntime.effectiveMode === "keycloak",
      nonAlertsProtectedReadSliceLabel: "water_quality_detail_read",
      nonAlertsProtectedReadSliceEnforced: authRuntime.effectiveMode === "keycloak",
      secondaryNonAlertsProtectedReadSliceLabel: "feed_detail_read",
      secondaryNonAlertsProtectedReadSliceEnforced: authRuntime.effectiveMode === "keycloak",
      tertiaryNonAlertsProtectedReadSliceLabel: "ponds_detail_read",
      tertiaryNonAlertsProtectedReadSliceEnforced: authRuntime.effectiveMode === "keycloak",
      quaternaryNonAlertsProtectedReadSliceLabel: "tasks_detail_read",
      quaternaryNonAlertsProtectedReadSliceEnforced: authRuntime.effectiveMode === "keycloak",
      quinaryNonAlertsProtectedReadSliceLabel: "water_quality_recent_read",
      quinaryNonAlertsProtectedReadSliceEnforced: authRuntime.effectiveMode === "keycloak",
      senaryNonAlertsProtectedReadSliceLabel: "feed_recent_read",
      senaryNonAlertsProtectedReadSliceEnforced: authRuntime.effectiveMode === "keycloak",
      nonAlertsProtectedSliceLabel: "tasks_update",
      nonAlertsProtectedSliceEnforced: authRuntime.effectiveMode === "keycloak",
      secondaryNonAlertsProtectedSliceLabel: "feed_update",
      secondaryNonAlertsProtectedSliceEnforced: authRuntime.effectiveMode === "keycloak",
      tertiaryNonAlertsProtectedSliceLabel: "ponds_update",
      tertiaryNonAlertsProtectedSliceEnforced: authRuntime.effectiveMode === "keycloak",
      quaternaryNonAlertsProtectedSliceLabel: "water_quality_create",
      quaternaryNonAlertsProtectedSliceEnforced: authRuntime.effectiveMode === "keycloak",
      quinaryNonAlertsProtectedSliceLabel: "water_quality_update",
      quinaryNonAlertsProtectedSliceEnforced: authRuntime.effectiveMode === "keycloak",
      senaryNonAlertsProtectedSliceLabel: "feed_create",
      senaryNonAlertsProtectedSliceEnforced: authRuntime.effectiveMode === "keycloak",
      septenaryNonAlertsProtectedSliceLabel: "tasks_create",
      septenaryNonAlertsProtectedSliceEnforced: authRuntime.effectiveMode === "keycloak",
      octonaryNonAlertsProtectedSliceLabel: "ponds_create",
      octonaryNonAlertsProtectedSliceEnforced: authRuntime.effectiveMode === "keycloak",
      defaultLocalUserLabel: `${authRuntime.localUser.displayName} (${authRuntime.localUser.username})`,
      warnings: authWarnings
    };

    if (authRuntime.effectiveMode === "keycloak" && !authRuntime.keycloak.verificationAvailable) {
      authWarnings.push({
        code: "AUTH_KEYCLOAK_VERIFICATION_UNAVAILABLE",
        message:
          "Keycloak mode is enabled, but JWKS verification is not available yet because auth config is incomplete."
      });
    }

    if (authRuntime.effectiveMode === "keycloak" && authRuntime.keycloak.verificationAvailable) {
      authWarnings.push({
        code: "AUTH_FIRST_PROTECTED_SLICE_ACTIVE",
        message:
          "The first protected auth slice is active on the runtime diagnostics API. Other API surfaces remain on incremental rollout for now."
      });
      authWarnings.push({
        code: "AUTH_ALERT_LIST_READ_SLICE_ACTIVE",
        message:
          "Alerts list reads now require verified auth in Keycloak mode. Disabled and local modes still keep the bounded list surface usable for development."
      });
      authWarnings.push({
        code: "AUTH_ALERT_DETAIL_READ_SLICE_ACTIVE",
        message:
          "Alerts detail reads now require verified auth in Keycloak mode. Disabled and local modes still keep the bounded detail surface usable for development."
      });
      authWarnings.push({
        code: "AUTH_ALERT_SUMMARY_READ_SLICE_ACTIVE",
        message:
          "Alerts summary reads now require verified auth in Keycloak mode. Disabled and local modes still keep the bounded summary surface usable for development."
      });
      authWarnings.push({
        code: "AUTH_OPERATOR_SLICE_ACTIVE",
        message:
          "Alerts lifecycle actions now require verified auth in Keycloak mode. Local and disabled modes still keep the operator flow usable for bounded development."
      });
      authWarnings.push({
        code: "AUTH_TRIAGE_SLICE_ACTIVE",
        message:
          "Alerts triage actions now require verified auth in Keycloak mode. Local and disabled modes still keep the bounded triage flow usable for development."
      });
      authWarnings.push({
        code: "AUTH_BULK_SLICE_ACTIVE",
        message:
          "Alerts bulk actions now require verified auth in Keycloak mode. Local and disabled modes still keep the bounded bulk flow usable for development."
      });
      authWarnings.push({
        code: "AUTH_SAVED_VIEW_MUTATION_SLICE_ACTIVE",
        message:
          "Alerts saved-view mutation actions now require verified auth in Keycloak mode. Local and disabled modes still keep the bounded saved-view flow usable for development."
      });
      authWarnings.push({
        code: "AUTH_TASKS_UPDATE_SLICE_ACTIVE",
        message:
          "Tasks update actions now require verified auth in Keycloak mode. Local and disabled modes still keep the bounded non-alert operator flow usable for development."
      });
      authWarnings.push({
        code: "AUTH_FEED_UPDATE_SLICE_ACTIVE",
        message:
          "Feed update actions now require verified auth in Keycloak mode. Local and disabled modes still keep the bounded non-alert operator flow usable for development."
      });
      authWarnings.push({
        code: "AUTH_PONDS_UPDATE_SLICE_ACTIVE",
        message:
          "Ponds update actions now require verified auth in Keycloak mode. Local and disabled modes still keep the bounded non-alert operator flow usable for development."
      });
      authWarnings.push({
        code: "AUTH_WATER_QUALITY_CREATE_SLICE_ACTIVE",
        message:
          "Water-quality create actions now require verified auth in Keycloak mode. Local and disabled modes still keep the bounded non-alert operator flow usable for development."
      });
      authWarnings.push({
        code: "AUTH_WATER_QUALITY_UPDATE_SLICE_ACTIVE",
        message:
          "Water-quality update actions now require verified auth in Keycloak mode. Local and disabled modes still keep the bounded non-alert operator flow usable for development."
      });
      authWarnings.push({
        code: "AUTH_FEED_CREATE_SLICE_ACTIVE",
        message:
          "Feed create actions now require verified auth in Keycloak mode. Local and disabled modes still keep the bounded non-alert operator flow usable for development."
      });
      authWarnings.push({
        code: "AUTH_TASKS_CREATE_SLICE_ACTIVE",
        message:
          "Tasks create actions now require verified auth in Keycloak mode. Local and disabled modes still keep the bounded non-alert operator flow usable for development."
      });
      authWarnings.push({
        code: "AUTH_WATER_QUALITY_DETAIL_READ_SLICE_ACTIVE",
        message:
          "Water-quality detail reads now require verified auth in Keycloak mode. Disabled and local modes still keep the bounded non-alert read surface usable for development."
      });
      authWarnings.push({
        code: "AUTH_FEED_DETAIL_READ_SLICE_ACTIVE",
        message:
          "Feed detail reads now require verified auth in Keycloak mode. Disabled and local modes still keep the bounded non-alert read surface usable for development."
      });
      authWarnings.push({
        code: "AUTH_PONDS_DETAIL_READ_SLICE_ACTIVE",
        message:
          "Ponds detail reads now require verified auth in Keycloak mode. Disabled and local modes still keep the bounded non-alert read surface usable for development."
      });
      authWarnings.push({
        code: "AUTH_TASKS_DETAIL_READ_SLICE_ACTIVE",
        message:
          "Tasks detail reads now require verified auth in Keycloak mode. Disabled and local modes still keep the bounded non-alert read surface usable for development."
      });
      authWarnings.push({
        code: "AUTH_WATER_QUALITY_RECENT_READ_SLICE_ACTIVE",
        message:
          "Water-quality recent pond reads now require verified auth in Keycloak mode. Disabled and local modes still keep the bounded non-alert read surface usable for development."
      });
      authWarnings.push({
        code: "AUTH_FEED_RECENT_READ_SLICE_ACTIVE",
        message:
          "Feed recent/history reads now require verified auth in Keycloak mode. Disabled and local modes still keep the bounded non-alert read surface usable for development."
      });
      authWarnings.push({
        code: "AUTH_PONDS_CREATE_SLICE_ACTIVE",
        message:
          "Ponds create actions now require verified auth in Keycloak mode. Local and disabled modes still keep the bounded non-alert operator flow usable for development."
      });
    }

    if (cachedKeycloakVerification?.status === "degraded" && cachedKeycloakVerification.message) {
      authWarnings.push({
        code: "AUTH_VERIFICATION_DEGRADED",
        message: cachedKeycloakVerification.message
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
      auth: authDiagnostics,
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
      aiOperatorAssistance: {
        enabled: true,
        advisoryOnly: true,
        mode: operatorAssistanceRuntime.configured ? "openai_nano" : "fallback",
        configured: operatorAssistanceRuntime.configured,
        modelLabel: operatorAssistanceRuntime.modelLabel,
        providerPath: operatorAssistanceRuntime.configured
          ? "openai_responses_api"
          : "deterministic_fallback",
        fallbackActive: !operatorAssistanceRuntime.configured,
        supportedTasks: ["daily_farm_summary", "shift_handover_generate", "dashboard_assistant_query"],
        warnings: operatorAssistanceRuntime.warnings
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
        ticketBootstrapPath: alertsLiveUpdatesRuntime.ticketBootstrapPath,
        ticketTtlSeconds: Math.floor(alertsLiveUpdatesRuntime.ticketTtlMs / 1000),
        gatewayAttached: cachedAlertsLiveUpdatesState?.gatewayAttached ?? false,
        activeConnections: cachedAlertsLiveUpdatesState?.activeConnections ?? 0,
        subscriptionPolicy: !alertsLiveUpdatesRuntime.enabled
          ? "disabled"
          : authRuntime.effectiveMode === "keycloak"
            ? "authenticated_operator_required"
            : "bypassed_local",
        credentialMode: alertsLiveUpdatesRuntime.enabled ? "ephemeral_ticket" : "none",
        authenticatedConnections: cachedAlertsLiveUpdatesState?.authenticatedConnections ?? 0,
        bypassedConnections: cachedAlertsLiveUpdatesState?.bypassedConnections ?? 0,
        lastTicketIssuedAt: cachedAlertsLiveUpdatesState?.lastTicketIssuedAt,
        lastTicketIssuedState: cachedAlertsLiveUpdatesState?.lastTicketIssuedState,
        lastSubscriptionAt: cachedAlertsLiveUpdatesState?.lastSubscriptionAt,
        lastSubscriptionState: cachedAlertsLiveUpdatesState?.lastSubscriptionState,
        lastSubscriptionReason: cachedAlertsLiveUpdatesState?.lastSubscriptionReason,
        lastEventAt: cachedAlertsLiveUpdatesState?.lastEventAt,
        warnings: alertsLiveUpdatesRuntime.enabled
          ? [
              ...alertsLiveUpdatesRuntime.warnings,
              ...(authRuntime.effectiveMode === "keycloak"
                ? [
                    {
                      code: "ALERTS_LIVE_UPDATES_AUTHENTICATED_SUBSCRIPTIONS_REQUIRED",
                      message:
                        "Alerts live updates require authenticated operator websocket subscriptions while Keycloak mode is active."
                    }
                  ]
                : [
                    {
                      code: "ALERTS_LIVE_UPDATES_BYPASS_LOCAL",
                      message:
                        "Alerts live updates are running on the bounded local bypass path because API auth is disabled or local mode is active."
                    }
                  ]),
              ...(!(cachedAlertsLiveUpdatesState?.gatewayAttached ?? false)
                ? [
                    {
                      code: "ALERTS_LIVE_UPDATES_GATEWAY_PENDING",
                      message:
                        "Alerts live updates are enabled, but the websocket gateway has not attached to the current API server yet."
                    }
                  ]
                : []),
              ...(cachedAlertsLiveUpdatesState?.gatewayAttached &&
              (cachedAlertsLiveUpdatesState?.activeConnections ?? 0) === 0
                ? [
                    {
                      code: "ALERTS_LIVE_UPDATES_IDLE",
                      message:
                        "Alerts live updates are enabled and the websocket gateway is attached, but no active browser connections are using it yet."
                    }
                  ]
                : [])
            ]
          : [
              ...alertsLiveUpdatesRuntime.warnings,
              {
                code: "ALERTS_LIVE_UPDATES_DISABLED",
                message:
                  "Alerts live updates are disabled by default. Enable AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES to attach the local websocket gateway."
              }
            ]
      },
      ponds: {
        postgresReadCutoverAvailable: true,
        postgresWriteCutoverAvailable: true,
        requestedAdapter: runtime.persistence.requestedAdapter,
        effectiveAdapter: pondsSelection.adapter,
        runtimeSwitchEnabled: true,
        cutoverActive: pondsSelection.adapter === "postgres",
        databaseConfigured: configured,
        connectivityStatus: connectivity.status,
        warnings: pondsWarnings
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
