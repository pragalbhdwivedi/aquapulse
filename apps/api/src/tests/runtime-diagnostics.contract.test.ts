import { describe, expect, it } from "vitest";
import { setCachedAlertsLiveUpdatesGatewayState } from "../common/config/alerts-live-updates-cache";
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
    expect(diagnostics.auth?.effectiveMode).toBe("disabled");
    expect(diagnostics.auth?.bypassActive).toBe(true);
    expect(diagnostics.auth?.verificationStatus).toBe("disabled");
    expect(diagnostics.auth?.protectedReadSliceLabel).toBe("alerts_list_read");
    expect(diagnostics.auth?.protectedReadSliceEnforced).toBe(false);
    expect(diagnostics.auth?.secondaryProtectedReadSliceLabel).toBe("alerts_detail_read");
    expect(diagnostics.auth?.secondaryProtectedReadSliceEnforced).toBe(false);
    expect(diagnostics.auth?.tertiaryProtectedReadSliceLabel).toBe("alerts_summary_read");
    expect(diagnostics.auth?.tertiaryProtectedReadSliceEnforced).toBe(false);
    expect(diagnostics.auth?.protectedOperatorSliceLabel).toBe("alerts_lifecycle_actions");
    expect(diagnostics.auth?.protectedOperatorSliceEnforced).toBe(false);
    expect(diagnostics.auth?.secondaryProtectedSliceLabel).toBe("alerts_triage_actions");
    expect(diagnostics.auth?.secondaryProtectedSliceEnforced).toBe(false);
    expect(diagnostics.auth?.tertiaryProtectedSliceLabel).toBe("alerts_bulk_actions");
    expect(diagnostics.auth?.tertiaryProtectedSliceEnforced).toBe(false);
    expect(diagnostics.auth?.quaternaryProtectedSliceLabel).toBe("alerts_saved_view_mutations");
    expect(diagnostics.auth?.quaternaryProtectedSliceEnforced).toBe(false);
    expect(diagnostics.auth?.nonAlertsOperatorAccessSummaryLabel).toBe("non_alert_operator_update_access");
    expect(diagnostics.auth?.nonAlertsOperatorAccessSummaryEnforced).toBe(false);
    expect(diagnostics.auth?.nonAlertsReadAccessSummaryLabel).toBe("non_alert_read_access");
    expect(diagnostics.auth?.nonAlertsReadAccessSummaryEnforced).toBe(false);
    expect(diagnostics.auth?.nonAlertsProtectedReadSliceLabel).toBe("water_quality_detail_read");
    expect(diagnostics.auth?.nonAlertsProtectedReadSliceEnforced).toBe(false);
    expect(diagnostics.auth?.secondaryNonAlertsProtectedReadSliceLabel).toBe("feed_detail_read");
    expect(diagnostics.auth?.secondaryNonAlertsProtectedReadSliceEnforced).toBe(false);
    expect(diagnostics.auth?.tertiaryNonAlertsProtectedReadSliceLabel).toBe("ponds_detail_read");
    expect(diagnostics.auth?.tertiaryNonAlertsProtectedReadSliceEnforced).toBe(false);
    expect(diagnostics.auth?.quaternaryNonAlertsProtectedReadSliceLabel).toBe("tasks_detail_read");
    expect(diagnostics.auth?.quaternaryNonAlertsProtectedReadSliceEnforced).toBe(false);
    expect(diagnostics.auth?.quinaryNonAlertsProtectedReadSliceLabel).toBe("water_quality_recent_read");
    expect(diagnostics.auth?.quinaryNonAlertsProtectedReadSliceEnforced).toBe(false);
    expect(diagnostics.auth?.senaryNonAlertsProtectedReadSliceLabel).toBe("feed_recent_read");
    expect(diagnostics.auth?.senaryNonAlertsProtectedReadSliceEnforced).toBe(false);
    expect(diagnostics.auth?.nonAlertsProtectedSliceLabel).toBe("tasks_update");
    expect(diagnostics.auth?.nonAlertsProtectedSliceEnforced).toBe(false);
    expect(diagnostics.auth?.secondaryNonAlertsProtectedSliceLabel).toBe("feed_update");
    expect(diagnostics.auth?.secondaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(diagnostics.auth?.tertiaryNonAlertsProtectedSliceLabel).toBe("ponds_update");
    expect(diagnostics.auth?.tertiaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(diagnostics.auth?.quaternaryNonAlertsProtectedSliceLabel).toBe("water_quality_create");
    expect(diagnostics.auth?.quaternaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(diagnostics.auth?.quinaryNonAlertsProtectedSliceLabel).toBe("water_quality_update");
    expect(diagnostics.auth?.quinaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(diagnostics.auth?.senaryNonAlertsProtectedSliceLabel).toBe("feed_create");
    expect(diagnostics.auth?.senaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(diagnostics.auth?.septenaryNonAlertsProtectedSliceLabel).toBe("tasks_create");
    expect(diagnostics.auth?.septenaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(diagnostics.auth?.octonaryNonAlertsProtectedSliceLabel).toBe("ponds_create");
    expect(diagnostics.auth?.octonaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(diagnostics.database.host).toBe("db.internal");
    expect(diagnostics.database.configured).toBe(true);
    expect(diagnostics.database.connectivity.status).toBe("configured_only");
    expect(diagnostics.aiExplanations.mode).toBe("fallback");
    expect(diagnostics.aiExplanations.configured).toBe(false);
    expect(diagnostics.aiOperatorAssistance?.enabled).toBe(true);
    expect(diagnostics.aiOperatorAssistance?.mode).toBe("fallback");
    expect(diagnostics.aiOperatorAssistance?.configured).toBe(false);
    expect(diagnostics.aiOperatorAssistance?.supportedTasks).toEqual([
      "daily_farm_summary",
      "shift_handover_generate"
    ]);
    expect(diagnostics.alerts.localBridgeExpectedPath).toBe("/api/alerts");
    expect(diagnostics.alerts.localAiExplainBridgeExpectedPath).toBe("/api/ai/alerts");
    expect(diagnostics.alertsLiveUpdates?.enabled).toBe(false);
    expect(diagnostics.alertsLiveUpdates?.gatewayPath).toBe("/ws/alerts");
    expect(diagnostics.alertsLiveUpdates?.gatewayAttached).toBe(false);
    expect(diagnostics.alertsLiveUpdates?.subscriptionPolicy).toBe("disabled");
    expect(diagnostics.alertsLiveUpdates?.authenticatedConnections).toBe(0);
    expect(diagnostics.alertsLiveUpdates?.bypassedConnections).toBe(0);
    expect(diagnostics.alertsLiveUpdates?.warnings.map((warning) => warning.code)).toContain(
      "ALERTS_LIVE_UPDATES_DISABLED"
    );
    expect(diagnostics.alerts.requestedAdapter).toBe("postgres");
    expect(diagnostics.alerts.effectiveAdapter).toBe("in-memory");
    expect(diagnostics.alerts.cutoverActive).toBe(false);
    expect(diagnostics.alerts.connectivityStatus).toBe("configured_only");
    expect(diagnostics.feed?.requestedAdapter).toBe("postgres");
    expect(diagnostics.feed?.effectiveAdapter).toBe("in-memory");
    expect(diagnostics.feed?.cutoverActive).toBe(false);
    expect(diagnostics.feed?.localBridgeExpectedPath).toBe("/api/feed");
    expect(diagnostics.ponds?.requestedAdapter).toBe("postgres");
    expect(diagnostics.ponds?.effectiveAdapter).toBe("in-memory");
    expect(diagnostics.ponds?.cutoverActive).toBe(false);
    expect(diagnostics.tasks?.requestedAdapter).toBe("postgres");
    expect(diagnostics.tasks?.effectiveAdapter).toBe("in-memory");
    expect(diagnostics.tasks?.cutoverActive).toBe(false);
    expect(diagnostics.waterQuality.requestedAdapter).toBe("postgres");
    expect(diagnostics.waterQuality.effectiveAdapter).toBe("in-memory");
    expect(diagnostics.waterQuality.cutoverActive).toBe(false);
    expect(diagnostics.warnings.map((warning) => warning.code)).toContain("POSTGRES_DISABLED");
    expect(diagnostics.alerts.warnings.map((warning) => warning.code)).toContain(
      "ALERTS_POSTGRES_DISABLED"
    );
    expect(diagnostics.feed?.warnings.map((warning) => warning.code)).toContain(
      "FEED_POSTGRES_DISABLED"
    );
    expect(diagnostics.ponds?.warnings.map((warning) => warning.code)).toContain(
      "PONDS_POSTGRES_DISABLED"
    );
    expect(diagnostics.tasks?.warnings.map((warning) => warning.code)).toContain(
      "TASKS_POSTGRES_DISABLED"
    );
    expect(diagnostics.waterQuality.warnings.map((warning) => warning.code)).toContain(
      "WATER_QUALITY_POSTGRES_DISABLED"
    );
  });

  it("surfaces bounded auth diagnostics without requiring a live keycloak instance", () => {
    const service = new RuntimeDiagnosticsService({
      env: {
        AQUAPULSE_AUTH_MODE: "keycloak",
        AQUAPULSE_KEYCLOAK_ISSUER_URL: "https://id.example.com/realms/aquapulse",
        AQUAPULSE_KEYCLOAK_JWKS_URL: "https://id.example.com/jwks",
        AQUAPULSE_KEYCLOAK_REALM: "aquapulse",
        AQUAPULSE_KEYCLOAK_CLIENT_ID: "aquapulse-web"
      }
    });

    const diagnostics = service.getRuntimeDiagnostics();

    expect(diagnostics.auth?.requestedMode).toBe("keycloak");
    expect(diagnostics.auth?.effectiveMode).toBe("keycloak");
    expect(diagnostics.auth?.active).toBe(true);
    expect(diagnostics.auth?.validationStrategy).toBe("keycloak_bearer_claims");
    expect(diagnostics.auth?.verificationAvailable).toBe(true);
    expect(diagnostics.auth?.tokenValidation).toBe("jwks_ready");
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_FIRST_PROTECTED_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_ALERT_LIST_READ_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_ALERT_DETAIL_READ_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_ALERT_SUMMARY_READ_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.protectedReadSliceEnforced).toBe(true);
    expect(diagnostics.auth?.secondaryProtectedReadSliceEnforced).toBe(true);
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_OPERATOR_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_TRIAGE_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_BULK_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_SAVED_VIEW_MUTATION_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_TASKS_UPDATE_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_FEED_UPDATE_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_PONDS_UPDATE_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_WATER_QUALITY_CREATE_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_WATER_QUALITY_UPDATE_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_WATER_QUALITY_DETAIL_READ_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_FEED_DETAIL_READ_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_PONDS_DETAIL_READ_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_TASKS_DETAIL_READ_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_WATER_QUALITY_RECENT_READ_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_FEED_RECENT_READ_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_FEED_CREATE_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_TASKS_CREATE_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.warnings.map((warning) => warning.code)).toContain(
      "AUTH_PONDS_CREATE_SLICE_ACTIVE"
    );
    expect(diagnostics.auth?.protectedOperatorSliceEnforced).toBe(true);
    expect(diagnostics.auth?.secondaryProtectedSliceEnforced).toBe(true);
    expect(diagnostics.auth?.tertiaryProtectedSliceEnforced).toBe(true);
    expect(diagnostics.auth?.quaternaryProtectedSliceEnforced).toBe(true);
    expect(diagnostics.auth?.nonAlertsOperatorAccessSummaryEnforced).toBe(true);
    expect(diagnostics.auth?.nonAlertsReadAccessSummaryEnforced).toBe(true);
    expect(diagnostics.auth?.nonAlertsProtectedReadSliceEnforced).toBe(true);
    expect(diagnostics.auth?.secondaryNonAlertsProtectedReadSliceEnforced).toBe(true);
    expect(diagnostics.auth?.tertiaryNonAlertsProtectedReadSliceEnforced).toBe(true);
    expect(diagnostics.auth?.quaternaryNonAlertsProtectedReadSliceEnforced).toBe(true);
    expect(diagnostics.auth?.quinaryNonAlertsProtectedReadSliceEnforced).toBe(true);
    expect(diagnostics.auth?.senaryNonAlertsProtectedReadSliceEnforced).toBe(true);
    expect(diagnostics.auth?.nonAlertsProtectedSliceEnforced).toBe(true);
    expect(diagnostics.auth?.secondaryNonAlertsProtectedSliceEnforced).toBe(true);
    expect(diagnostics.auth?.tertiaryNonAlertsProtectedSliceEnforced).toBe(true);
    expect(diagnostics.auth?.quaternaryNonAlertsProtectedSliceEnforced).toBe(true);
    expect(diagnostics.auth?.quinaryNonAlertsProtectedSliceEnforced).toBe(true);
    expect(diagnostics.auth?.senaryNonAlertsProtectedSliceEnforced).toBe(true);
    expect(diagnostics.auth?.septenaryNonAlertsProtectedSliceEnforced).toBe(true);
    expect(diagnostics.auth?.octonaryNonAlertsProtectedSliceEnforced).toBe(true);
    expect(diagnostics.alertsLiveUpdates?.subscriptionPolicy).toBe("disabled");
  });

  it("surfaces bounded AI operator assistance diagnostics without requiring a live OpenAI provider", () => {
    const service = new RuntimeDiagnosticsService({
      env: {
        AQUAPULSE_AI_OPERATOR_ASSISTANCE_MODE: "openai"
      }
    });

    const diagnostics = service.getRuntimeDiagnostics();

    expect(diagnostics.aiOperatorAssistance?.enabled).toBe(true);
    expect(diagnostics.aiOperatorAssistance?.mode).toBe("fallback");
    expect(diagnostics.aiOperatorAssistance?.configured).toBe(false);
    expect(diagnostics.aiOperatorAssistance?.providerPath).toBe("deterministic_fallback");
    expect(diagnostics.aiOperatorAssistance?.warnings.map((warning) => warning.code)).toContain(
      "OPENAI_API_KEY_MISSING"
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
    expect(diagnostics.feed?.effectiveAdapter).toBe("postgres");
    expect(diagnostics.feed?.cutoverActive).toBe(true);
    expect(diagnostics.ponds?.effectiveAdapter).toBe("postgres");
    expect(diagnostics.ponds?.cutoverActive).toBe(true);
    expect(diagnostics.tasks?.effectiveAdapter).toBe("postgres");
    expect(diagnostics.tasks?.cutoverActive).toBe(true);
    expect(diagnostics.waterQuality.effectiveAdapter).toBe("postgres");
    expect(diagnostics.waterQuality.cutoverActive).toBe(true);
    expect(diagnostics.alerts.databaseConfigured).toBe(true);
    expect(diagnostics.alerts.runtimeSwitchEnabled).toBe(true);
  });

  it("surfaces websocket gateway diagnostics without requiring a live connection", () => {
    setCachedAlertsLiveUpdatesGatewayState({
      gatewayAttached: true,
      activeConnections: 2,
      authenticatedConnections: 1,
      bypassedConnections: 1,
      lastTicketIssuedAt: "2026-04-22T09:09:30.000Z",
      lastTicketIssuedState: "authenticated",
      lastSubscriptionAt: "2026-04-22T09:10:00.000Z",
      lastSubscriptionState: "authenticated",
      lastSubscriptionReason: "Accepted an authenticated alerts websocket subscription.",
      lastEventAt: "2026-04-22T09:15:00.000Z"
    });

    const service = new RuntimeDiagnosticsService({
      env: {
        AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES: "true",
        AQUAPULSE_ALERTS_LIVE_UPDATES_PATH: "/ws/alerts"
      }
    });

    const diagnostics = service.getRuntimeDiagnostics();

    expect(diagnostics.alertsLiveUpdates?.enabled).toBe(true);
    expect(diagnostics.alertsLiveUpdates?.gatewayAttached).toBe(true);
    expect(diagnostics.alertsLiveUpdates?.activeConnections).toBe(2);
    expect(diagnostics.alertsLiveUpdates?.ticketBootstrapPath).toBe("/api/alerts/live-updates/session");
    expect(diagnostics.alertsLiveUpdates?.credentialMode).toBe("ephemeral_ticket");
    expect(diagnostics.alertsLiveUpdates?.authenticatedConnections).toBe(1);
    expect(diagnostics.alertsLiveUpdates?.bypassedConnections).toBe(1);
    expect(diagnostics.alertsLiveUpdates?.lastTicketIssuedState).toBe("authenticated");
    expect(diagnostics.alertsLiveUpdates?.lastSubscriptionState).toBe("authenticated");
    expect(diagnostics.alertsLiveUpdates?.lastEventAt).toBe("2026-04-22T09:15:00.000Z");
    expect(diagnostics.alertsLiveUpdates?.warnings.map((warning) => warning.code)).not.toContain(
      "ALERTS_LIVE_UPDATES_IDLE"
    );

    setCachedAlertsLiveUpdatesGatewayState(undefined);
  });

  it("shows pending or idle websocket diagnostics when the live gateway is enabled locally", () => {
    setCachedAlertsLiveUpdatesGatewayState({
      gatewayAttached: false,
      activeConnections: 0,
      authenticatedConnections: 0,
      bypassedConnections: 0,
      lastTicketIssuedState: "unavailable"
    });

    const pendingService = new RuntimeDiagnosticsService({
      env: {
        AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES: "true"
      }
    });

    expect(
      pendingService.getRuntimeDiagnostics().alertsLiveUpdates?.warnings.map((warning) => warning.code)
    ).toContain("ALERTS_LIVE_UPDATES_GATEWAY_PENDING");

    setCachedAlertsLiveUpdatesGatewayState({
      gatewayAttached: true,
      activeConnections: 0,
      authenticatedConnections: 0,
      bypassedConnections: 0,
      lastTicketIssuedState: "bypassed_local"
    });

    const idleService = new RuntimeDiagnosticsService({
      env: {
        AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES: "true"
      }
    });

    expect(
      idleService.getRuntimeDiagnostics().alertsLiveUpdates?.warnings.map((warning) => warning.code)
    ).toContain("ALERTS_LIVE_UPDATES_IDLE");

    setCachedAlertsLiveUpdatesGatewayState(undefined);
  });

  it("shows an authenticated subscription policy when live updates and keycloak mode are both active", () => {
    const service = new RuntimeDiagnosticsService({
      env: {
        AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES: "true",
        AQUAPULSE_AUTH_MODE: "keycloak",
        AQUAPULSE_KEYCLOAK_ISSUER_URL: "https://id.example.com/realms/aquapulse",
        AQUAPULSE_KEYCLOAK_JWKS_URL: "https://id.example.com/jwks",
        AQUAPULSE_KEYCLOAK_REALM: "aquapulse",
        AQUAPULSE_KEYCLOAK_CLIENT_ID: "aquapulse-web"
      }
    });

    expect(service.getRuntimeDiagnostics().alertsLiveUpdates?.subscriptionPolicy).toBe(
      "authenticated_operator_required"
    );
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
    expect(diagnostics.feed?.connectivityStatus).toBe("reachable");
    expect(diagnostics.tasks?.connectivityStatus).toBe("reachable");
    expect(diagnostics.waterQuality.connectivityStatus).toBe("reachable");

    setCachedDatabaseConnectionStatus(undefined);
  });
});
