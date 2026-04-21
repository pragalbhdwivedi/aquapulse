import { describe, expect, it } from "vitest";
import {
  deriveAlertsEndToEndRuntimeStatus,
  deriveFeedEndToEndRuntimeStatus,
  deriveTasksEndToEndRuntimeStatus,
  deriveWaterQualityEndToEndRuntimeStatus,
  probeBackendRuntimeDiagnostics,
  readFrontendRuntimeDiagnostics,
  readRuntimeProbeConfig
} from "../features/runtime-diagnostics";

describe("Frontend runtime diagnostics", () => {
  it("keeps default runtime on safe mock/in-memory assumptions", () => {
    const diagnostics = readFrontendRuntimeDiagnostics({});

    expect(diagnostics.service).toBe("web");
    expect(diagnostics.mode.effectiveMode).toBe("mock");
    expect(diagnostics.mode.safeFallbackActive).toBe(true);
    expect(diagnostics.auth.effectiveMode).toBe("disabled");
    expect(diagnostics.auth.bypassActive).toBe(true);
    expect(diagnostics.alerts.effectiveMode).toBe("mock");
    expect(diagnostics.alertsLiveUpdates.enabled).toBe(false);
    expect(diagnostics.alertsLiveUpdates.connectionState).toBe("disabled");
    expect(diagnostics.feed.effectiveMode).toBe("mock");
    expect(diagnostics.tasks.effectiveMode).toBe("mock");
    expect(diagnostics.waterQuality.effectiveMode).toBe("mock");
    expect(diagnostics.localBridge.backendTargetLabel).toBe("http://localhost:4000");
  });

  it("keeps auth diagnostics aligned with requested vs effective frontend mode", () => {
    const diagnostics = readFrontendRuntimeDiagnostics({
      NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE: "keycloak",
      NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM: "aquapulse"
    });

    expect(diagnostics.auth.requestedMode).toBe("keycloak");
    expect(diagnostics.auth.effectiveMode).toBe("disabled");
    expect(diagnostics.auth.keycloakConfigured).toBe(false);
    expect(diagnostics.warnings.map((warning) => warning.code)).toContain(
      "AUTH_KEYCLOAK_CONFIG_INCOMPLETE"
    );
  });

  it("represents alerts-only HTTP proxy mode and bridge assumptions consistently", () => {
    const diagnostics = readFrontendRuntimeDiagnostics({
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_BASE_URL: "ws://localhost:4000/ws/alerts",
      AQUAPULSE_WEB_LOCAL_API_BACKEND_URL: "http://localhost:4001"
    });

    expect(diagnostics.alerts.effectiveMode).toBe("http");
    expect(diagnostics.alertsLiveUpdates.enabled).toBe(true);
    expect(diagnostics.alertsLiveUpdates.targetLabel).toBe("ws://localhost:4000/ws/alerts");
    expect(diagnostics.alerts.transport).toBe("proxy");
    expect(diagnostics.alerts.targetLabel).toBe("/api/alerts local bridge");
    expect(diagnostics.waterQuality.effectiveMode).toBe("mock");
    expect(diagnostics.localBridge.backendTargetLabel).toBe("http://localhost:4001");
    expect(diagnostics.localBridge.configured).toBe(true);
  });

  it("represents feed-only HTTP proxy mode and bridge assumptions consistently", () => {
    const diagnostics = readFrontendRuntimeDiagnostics({
      NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      AQUAPULSE_WEB_LOCAL_API_BACKEND_URL: "http://localhost:4003"
    });

    expect(diagnostics.alerts.effectiveMode).toBe("mock");
    expect(diagnostics.feed.effectiveMode).toBe("http");
    expect(diagnostics.feed.transport).toBe("proxy");
    expect(diagnostics.feed.targetLabel).toBe("/api/feed local bridge");
    expect(diagnostics.localBridge.backendTargetLabel).toBe("http://localhost:4003");
    expect(diagnostics.localBridge.configured).toBe(true);
  });

  it("represents tasks-only HTTP proxy mode and bridge assumptions consistently", () => {
    const diagnostics = readFrontendRuntimeDiagnostics({
      NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      AQUAPULSE_WEB_LOCAL_API_BACKEND_URL: "http://localhost:4004"
    });

    expect(diagnostics.alerts.effectiveMode).toBe("mock");
    expect(diagnostics.tasks.effectiveMode).toBe("http");
    expect(diagnostics.tasks.transport).toBe("proxy");
    expect(diagnostics.tasks.targetLabel).toBe("/api/tasks local bridge");
    expect(diagnostics.localBridge.backendTargetLabel).toBe("http://localhost:4004");
    expect(diagnostics.localBridge.configured).toBe(true);
  });

  it("represents water-quality-only HTTP proxy mode and bridge assumptions consistently", () => {
    const diagnostics = readFrontendRuntimeDiagnostics({
      NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      AQUAPULSE_WEB_LOCAL_API_BACKEND_URL: "http://localhost:4002"
    });

    expect(diagnostics.alerts.effectiveMode).toBe("mock");
    expect(diagnostics.waterQuality.effectiveMode).toBe("http");
    expect(diagnostics.waterQuality.transport).toBe("proxy");
    expect(diagnostics.waterQuality.targetLabel).toBe("/api/water-quality local bridge");
    expect(diagnostics.localBridge.backendTargetLabel).toBe("http://localhost:4002");
    expect(diagnostics.localBridge.configured).toBe(true);
  });

  it("derives a verified Postgres alerts cutover status only when frontend and backend agree", () => {
    const diagnostics = readFrontendRuntimeDiagnostics({
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true"
    });

    const status = deriveAlertsEndToEndRuntimeStatus(diagnostics, {
      enabled: true,
      status: "reachable",
      targetLabel: "http://localhost:4000",
      health: {
        ok: true,
        status: "ok",
        service: "api",
        version: "0.1.0",
        timestamp: "2026-04-16T00:00:00.000Z",
        runtime: {
          service: "api",
          mode: {
            defaultMode: "in-memory",
            requestedMode: "postgres",
            effectiveMode: "in-memory",
            safeFallbackActive: true
          },
          database: {
            configured: true,
            selectedAdapter: "in-memory",
            requestedAdapter: "postgres",
            postgresAdaptersEnabled: true,
            runtimeSwitchEnabled: false,
            healthcheckOnBoot: false,
            connectivity: {
              status: "configured_only",
              message: "Config present."
            }
          },
          alerts: {
            workbenchCutoverAvailable: true,
            postgresReadCutoverAvailable: true,
            postgresWriteCutoverAvailable: true,
            requestedAdapter: "postgres",
            effectiveAdapter: "postgres",
            runtimeSwitchEnabled: true,
            cutoverActive: true,
            databaseConfigured: true,
            connectivityStatus: "configured_only",
            localBridgeExpectedPath: "/api/alerts",
            localAiExplainBridgeExpectedPath: "/api/ai/alerts",
            warnings: []
          },
          waterQuality: {
            postgresReadCutoverAvailable: true,
            postgresWriteCutoverAvailable: true,
            requestedAdapter: "postgres",
            effectiveAdapter: "postgres",
            runtimeSwitchEnabled: true,
            cutoverActive: true,
            databaseConfigured: true,
            connectivityStatus: "configured_only",
            warnings: []
          },
          aiExplanations: {
            advisoryOnly: true,
            mode: "fallback",
            configured: false,
            modelLabel: "gpt-5-nano",
            cacheEnabled: true,
            attachmentAvailable: true,
            feedbackEnabled: true,
            warnings: []
          },
          warnings: []
        }
      },
      runtime: {
        service: "api",
        mode: {
          defaultMode: "in-memory",
          requestedMode: "postgres",
          effectiveMode: "in-memory",
          safeFallbackActive: true
        },
        database: {
          configured: true,
          selectedAdapter: "in-memory",
          requestedAdapter: "postgres",
          postgresAdaptersEnabled: true,
          runtimeSwitchEnabled: false,
          healthcheckOnBoot: false,
          connectivity: {
            status: "configured_only",
            message: "Config present."
          }
        },
        alerts: {
          workbenchCutoverAvailable: true,
          postgresReadCutoverAvailable: true,
          postgresWriteCutoverAvailable: true,
          requestedAdapter: "postgres",
          effectiveAdapter: "postgres",
          runtimeSwitchEnabled: true,
          cutoverActive: true,
          databaseConfigured: true,
          connectivityStatus: "configured_only",
          localBridgeExpectedPath: "/api/alerts",
          localAiExplainBridgeExpectedPath: "/api/ai/alerts",
          warnings: []
        },
        waterQuality: {
          postgresReadCutoverAvailable: true,
          postgresWriteCutoverAvailable: true,
          requestedAdapter: "postgres",
          effectiveAdapter: "postgres",
          runtimeSwitchEnabled: true,
          cutoverActive: true,
          databaseConfigured: true,
          connectivityStatus: "configured_only",
          warnings: []
        },
        aiExplanations: {
          advisoryOnly: true,
          mode: "fallback",
          configured: false,
          modelLabel: "gpt-5-nano",
          cacheEnabled: true,
          attachmentAvailable: true,
          feedbackEnabled: true,
          warnings: []
        },
        warnings: []
      },
      warnings: []
    });

    expect(status.cutoverActive).toBe(true);
    expect(status.backendAdapter).toBe("postgres");
    expect(status.statusLabel).toBe("HTTP + Postgres alerts cutover verified");
  });

  it("derives a verified Postgres water-quality cutover status only when frontend and backend agree", () => {
    const diagnostics = readFrontendRuntimeDiagnostics({
      NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true"
    });

    const status = deriveWaterQualityEndToEndRuntimeStatus(diagnostics, {
      enabled: true,
      status: "reachable",
      targetLabel: "http://localhost:4000",
      health: {
        ok: true,
        status: "ok",
        service: "api",
        version: "0.1.0",
        timestamp: "2026-04-16T00:00:00.000Z",
        runtime: {
          service: "api",
          mode: {
            defaultMode: "in-memory",
            requestedMode: "postgres",
            effectiveMode: "in-memory",
            safeFallbackActive: true
          },
          database: {
            configured: true,
            selectedAdapter: "in-memory",
            requestedAdapter: "postgres",
            postgresAdaptersEnabled: true,
            runtimeSwitchEnabled: false,
            healthcheckOnBoot: false,
            connectivity: {
              status: "configured_only",
              message: "Config present."
            }
          },
          alerts: {
            workbenchCutoverAvailable: true,
            postgresReadCutoverAvailable: true,
            postgresWriteCutoverAvailable: true,
            requestedAdapter: "postgres",
            effectiveAdapter: "in-memory",
            runtimeSwitchEnabled: true,
            cutoverActive: false,
            databaseConfigured: true,
            connectivityStatus: "configured_only",
            localBridgeExpectedPath: "/api/alerts",
            localAiExplainBridgeExpectedPath: "/api/ai/alerts",
            warnings: []
          },
          waterQuality: {
            postgresReadCutoverAvailable: true,
            postgresWriteCutoverAvailable: true,
            requestedAdapter: "postgres",
            effectiveAdapter: "postgres",
            runtimeSwitchEnabled: true,
            cutoverActive: true,
            databaseConfigured: true,
            connectivityStatus: "configured_only",
            warnings: []
          },
          aiExplanations: {
            advisoryOnly: true,
            mode: "fallback",
            configured: false,
            modelLabel: "gpt-5-nano",
            cacheEnabled: true,
            attachmentAvailable: true,
            feedbackEnabled: true,
            warnings: []
          },
          warnings: []
        }
      },
      runtime: {
        service: "api",
        mode: {
          defaultMode: "in-memory",
          requestedMode: "postgres",
          effectiveMode: "in-memory",
          safeFallbackActive: true
        },
        database: {
          configured: true,
          selectedAdapter: "in-memory",
          requestedAdapter: "postgres",
          postgresAdaptersEnabled: true,
          runtimeSwitchEnabled: false,
          healthcheckOnBoot: false,
          connectivity: {
            status: "configured_only",
            message: "Config present."
          }
        },
        alerts: {
          workbenchCutoverAvailable: true,
          postgresReadCutoverAvailable: true,
          postgresWriteCutoverAvailable: true,
          requestedAdapter: "postgres",
          effectiveAdapter: "in-memory",
          runtimeSwitchEnabled: true,
          cutoverActive: false,
          databaseConfigured: true,
          connectivityStatus: "configured_only",
          localBridgeExpectedPath: "/api/alerts",
          localAiExplainBridgeExpectedPath: "/api/ai/alerts",
          warnings: []
        },
        waterQuality: {
          postgresReadCutoverAvailable: true,
          postgresWriteCutoverAvailable: true,
          requestedAdapter: "postgres",
          effectiveAdapter: "postgres",
          runtimeSwitchEnabled: true,
          cutoverActive: true,
          databaseConfigured: true,
          connectivityStatus: "configured_only",
          warnings: []
        },
        aiExplanations: {
          advisoryOnly: true,
          mode: "fallback",
          configured: false,
          modelLabel: "gpt-5-nano",
          cacheEnabled: true,
          attachmentAvailable: true,
          feedbackEnabled: true,
          warnings: []
        },
        warnings: []
      },
      warnings: []
    });

    expect(status.cutoverActive).toBe(true);
    expect(status.backendAdapter).toBe("postgres");
    expect(status.statusLabel).toBe("HTTP + Postgres water-quality cutover verified");
  });

  it("derives a verified Postgres feed cutover status only when frontend and backend agree", () => {
    const diagnostics = readFrontendRuntimeDiagnostics({
      NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true"
    });

    const status = deriveFeedEndToEndRuntimeStatus(diagnostics, {
      enabled: true,
      status: "reachable",
      targetLabel: "http://localhost:4000",
      runtime: {
        service: "api",
        mode: {
          defaultMode: "in-memory",
          requestedMode: "postgres",
          effectiveMode: "in-memory",
          safeFallbackActive: true
        },
        database: {
          configured: true,
          selectedAdapter: "in-memory",
          requestedAdapter: "postgres",
          postgresAdaptersEnabled: true,
          runtimeSwitchEnabled: false,
          healthcheckOnBoot: false,
          connectivity: {
            status: "configured_only",
            message: "Config present."
          }
        },
        alerts: {
          workbenchCutoverAvailable: true,
          postgresReadCutoverAvailable: true,
          postgresWriteCutoverAvailable: true,
          requestedAdapter: "postgres",
          effectiveAdapter: "in-memory",
          runtimeSwitchEnabled: true,
          cutoverActive: false,
          databaseConfigured: true,
          connectivityStatus: "configured_only",
          localBridgeExpectedPath: "/api/alerts",
          localAiExplainBridgeExpectedPath: "/api/ai/alerts",
          warnings: []
        },
        feed: {
          postgresReadCutoverAvailable: true,
          postgresWriteCutoverAvailable: true,
          requestedAdapter: "postgres",
          effectiveAdapter: "postgres",
          runtimeSwitchEnabled: true,
          cutoverActive: true,
          databaseConfigured: true,
          connectivityStatus: "configured_only",
          localBridgeExpectedPath: "/api/feed",
          warnings: []
        },
        waterQuality: {
          postgresReadCutoverAvailable: true,
          postgresWriteCutoverAvailable: true,
          requestedAdapter: "postgres",
          effectiveAdapter: "in-memory",
          runtimeSwitchEnabled: true,
          cutoverActive: false,
          databaseConfigured: true,
          connectivityStatus: "configured_only",
          warnings: []
        },
        aiExplanations: {
          advisoryOnly: true,
          mode: "fallback",
          configured: false,
          modelLabel: "gpt-5-nano",
          cacheEnabled: true,
          attachmentAvailable: true,
          feedbackEnabled: true,
          warnings: []
        },
        warnings: []
      },
      warnings: []
    });

    expect(status.cutoverActive).toBe(true);
    expect(status.backendAdapter).toBe("postgres");
    expect(status.statusLabel).toBe("HTTP + Postgres feed cutover verified");
  });

  it("derives a verified Postgres tasks cutover status only when frontend and backend agree", () => {
    const diagnostics = readFrontendRuntimeDiagnostics({
      NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true"
    });

    const status = deriveTasksEndToEndRuntimeStatus(diagnostics, {
      enabled: true,
      status: "reachable",
      targetLabel: "http://localhost:4000",
      runtime: {
        service: "api",
        mode: {
          defaultMode: "in-memory",
          requestedMode: "postgres",
          effectiveMode: "in-memory",
          safeFallbackActive: true
        },
        database: {
          configured: true,
          selectedAdapter: "in-memory",
          requestedAdapter: "postgres",
          postgresAdaptersEnabled: true,
          runtimeSwitchEnabled: false,
          healthcheckOnBoot: false,
          connectivity: {
            status: "configured_only",
            message: "Config present."
          }
        },
        alerts: {
          workbenchCutoverAvailable: true,
          postgresReadCutoverAvailable: true,
          postgresWriteCutoverAvailable: true,
          requestedAdapter: "postgres",
          effectiveAdapter: "in-memory",
          runtimeSwitchEnabled: true,
          cutoverActive: false,
          databaseConfigured: true,
          connectivityStatus: "configured_only",
          localBridgeExpectedPath: "/api/alerts",
          localAiExplainBridgeExpectedPath: "/api/ai/alerts",
          warnings: []
        },
        feed: {
          postgresReadCutoverAvailable: true,
          postgresWriteCutoverAvailable: true,
          requestedAdapter: "postgres",
          effectiveAdapter: "in-memory",
          runtimeSwitchEnabled: true,
          cutoverActive: false,
          databaseConfigured: true,
          connectivityStatus: "configured_only",
          localBridgeExpectedPath: "/api/feed",
          warnings: []
        },
        tasks: {
          postgresReadCutoverAvailable: true,
          postgresWriteCutoverAvailable: true,
          requestedAdapter: "postgres",
          effectiveAdapter: "postgres",
          runtimeSwitchEnabled: true,
          cutoverActive: true,
          databaseConfigured: true,
          connectivityStatus: "configured_only",
          warnings: []
        },
        waterQuality: {
          postgresReadCutoverAvailable: true,
          postgresWriteCutoverAvailable: true,
          requestedAdapter: "postgres",
          effectiveAdapter: "in-memory",
          runtimeSwitchEnabled: true,
          cutoverActive: false,
          databaseConfigured: true,
          connectivityStatus: "configured_only",
          warnings: []
        },
        aiExplanations: {
          advisoryOnly: true,
          mode: "fallback",
          configured: false,
          modelLabel: "gpt-5-nano",
          cacheEnabled: true,
          attachmentAvailable: true,
          feedbackEnabled: true,
          warnings: []
        },
        warnings: []
      },
      warnings: []
    });

    expect(status.cutoverActive).toBe(true);
    expect(status.backendAdapter).toBe("postgres");
    expect(status.statusLabel).toBe("HTTP + Postgres tasks cutover verified");
  });

  it("keeps backend probing disabled by default", () => {
    const probeConfig = readRuntimeProbeConfig({});

    expect(probeConfig.enabled).toBe(false);
    expect(probeConfig.timeoutMs).toBe(1500);
    expect(probeConfig.warnings.map((warning) => warning.code)).toContain("PROBE_DISABLED");
  });

  it("probes backend diagnostics safely when enabled", async () => {
    const probe = await probeBackendRuntimeDiagnostics(
      readRuntimeProbeConfig({
        AQUAPULSE_WEB_ENABLE_RUNTIME_PROBES: "true",
        AQUAPULSE_WEB_LOCAL_API_BACKEND_URL: "http://localhost:4000"
      }),
      (async (input: string | URL) => {
        if (String(input).endsWith("/api/health")) {
          return new Response(
            JSON.stringify({
              ok: true,
              status: "ok",
              service: "api",
              version: "0.1.0",
              timestamp: "2026-04-16T00:00:00.000Z",
              runtime: {
                service: "api",
                mode: {
                  defaultMode: "in-memory",
                  effectiveMode: "in-memory",
                  safeFallbackActive: true
                },
                auth: {
                  requestedMode: "disabled",
                  effectiveMode: "disabled",
                  active: false,
                  bypassActive: true,
                  keycloakConfigured: false,
                  issuerLabel: "not configured",
                  validationStrategy: "disabled",
                  tokenValidation: "not_applicable",
                  defaultLocalUserLabel: "Local Operator (local.operator)",
                  warnings: []
                },
                database: {
                  configured: false,
                  selectedAdapter: "in-memory",
                  postgresAdaptersEnabled: false,
                  runtimeSwitchEnabled: false,
                  healthcheckOnBoot: false,
                  connectivity: {
                    status: "not_attempted",
                    message: "No DB check."
                  }
                },
                alerts: {
                  workbenchCutoverAvailable: true,
                  postgresReadCutoverAvailable: true,
                  postgresWriteCutoverAvailable: true,
                  requestedAdapter: "in-memory",
                  effectiveAdapter: "in-memory",
                  runtimeSwitchEnabled: true,
                  cutoverActive: false,
                  databaseConfigured: false,
                  connectivityStatus: "not_attempted",
                  localBridgeExpectedPath: "/api/alerts",
                  localAiExplainBridgeExpectedPath: "/api/ai/alerts",
                  warnings: []
                },
                waterQuality: {
                  postgresReadCutoverAvailable: true,
                  postgresWriteCutoverAvailable: true,
                  requestedAdapter: "in-memory",
                  effectiveAdapter: "in-memory",
                  runtimeSwitchEnabled: true,
                  cutoverActive: false,
                  databaseConfigured: false,
                  connectivityStatus: "not_attempted",
                  warnings: []
                },
                warnings: []
              }
            }),
            { status: 200 }
          );
        }

        return new Response(
          JSON.stringify({
            service: "api",
            mode: {
              defaultMode: "in-memory",
              effectiveMode: "in-memory",
              safeFallbackActive: true
            },
            auth: {
              requestedMode: "disabled",
              effectiveMode: "disabled",
              active: false,
              bypassActive: true,
              keycloakConfigured: false,
              issuerLabel: "not configured",
              validationStrategy: "disabled",
              tokenValidation: "not_applicable",
              defaultLocalUserLabel: "Local Operator (local.operator)",
              warnings: []
            },
            database: {
              configured: false,
              selectedAdapter: "in-memory",
              postgresAdaptersEnabled: false,
              runtimeSwitchEnabled: false,
              healthcheckOnBoot: false,
              connectivity: {
                status: "not_attempted",
                message: "No DB check."
              }
            },
            alerts: {
              workbenchCutoverAvailable: true,
              postgresReadCutoverAvailable: true,
              postgresWriteCutoverAvailable: true,
              requestedAdapter: "in-memory",
              effectiveAdapter: "in-memory",
              runtimeSwitchEnabled: true,
              cutoverActive: false,
              databaseConfigured: false,
              connectivityStatus: "not_attempted",
              localBridgeExpectedPath: "/api/alerts",
              localAiExplainBridgeExpectedPath: "/api/ai/alerts",
              warnings: []
            },
            waterQuality: {
              postgresReadCutoverAvailable: true,
              postgresWriteCutoverAvailable: true,
              requestedAdapter: "in-memory",
              effectiveAdapter: "in-memory",
              runtimeSwitchEnabled: true,
              cutoverActive: false,
              databaseConfigured: false,
              connectivityStatus: "not_attempted",
              warnings: []
            },
            warnings: []
          }),
          { status: 200 }
        );
      }) as typeof fetch
    );

    expect(probe.status).toBe("reachable");
    expect(probe.health?.service).toBe("api");
    expect(probe.runtime?.database.selectedAdapter).toBe("in-memory");
  });

  it("handles backend probe failures without crashing", async () => {
    const probe = await probeBackendRuntimeDiagnostics(
      readRuntimeProbeConfig({
        AQUAPULSE_WEB_ENABLE_RUNTIME_PROBES: "true"
      }),
      (async () => {
        throw new Error("connect ECONNREFUSED");
      }) as typeof fetch
    );

    expect(probe.status).toBe("unreachable");
    expect(probe.errorMessage).toContain("ECONNREFUSED");
    expect(probe.warnings.map((warning) => warning.code)).toContain("PROBE_UNREACHABLE");
  });
});
