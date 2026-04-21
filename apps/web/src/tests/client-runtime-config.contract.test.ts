import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { describe, expect, it } from "vitest";
import { createApiClientsFromConfig, createApiClientsFromEnv } from "../clients";
import {
  endpointInvocationRegistry,
  flattenEndpointInvocationRegistry
} from "../clients/invocation-registry";
import {
  getAlertsRuntimeDiagnostics,
  getFeedRuntimeDiagnostics,
  getDefaultClientRuntimeConfig,
  getWaterQualityRuntimeDiagnostics,
  parseClientRuntimeConfig,
  resolveAlertsHttpBaseUrl,
  resolveFeedHttpBaseUrl,
  resolveWaterQualityHttpBaseUrl
} from "../clients/runtime-config";

describe("Client runtime config and invocation registry", () => {
  it("defaults runtime parsing to mock mode", async () => {
    const defaultConfig = getDefaultClientRuntimeConfig();
    const parsedConfig = parseClientRuntimeConfig();
    const explicitHttpWithoutFlag = parseClientRuntimeConfig({
      AQUAPULSE_WEB_CLIENT_MODE: "http"
    });

    expect(defaultConfig.mode).toBe("mock");
    expect(parsedConfig.mode).toBe("mock");
    expect(explicitHttpWithoutFlag.mode).toBe("mock");

    const clients = createApiClientsFromEnv();
    const response = await clients.ponds.list({ page: 1, pageSize: 20 });
    expect(response.data.items[0]?.id).toBe("pond-1");
  });

  it("allows placeholder http mode only when explicitly enabled", async () => {
    const config = parseClientRuntimeConfig({
      AQUAPULSE_WEB_CLIENT_MODE: "http",
      AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP: "true"
    });
    const clients = createApiClientsFromConfig(config);
    const [response, acknowledged] = await Promise.all([
      clients.alerts.list({ page: 1, pageSize: 20, status: "open" }),
      clients.alerts.acknowledge("alert-1", {})
    ]);

    expect(config.mode).toBe("http");
    expect(response.data.items[0]?.id).toBe("alert-1");
    expect(acknowledged.data.status).toBe("acknowledged");
  });

  it("allows alerts-only HTTP override without changing the default global mode", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL: "http://alerts-backend.local"
    });

    expect(config.mode).toBe("mock");
    expect(config.alertsMode).toBe("http");
    expect(config.enableFetchHttp).toBe(true);
    expect(config.alertsHttpBaseUrl).toBe("http://alerts-backend.local");
  });

  it("allows water-quality-only HTTP override without changing the default global mode", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_BASE_URL: "http://water-quality-backend.local"
    });

    expect(config.mode).toBe("mock");
    expect(config.waterQualityMode).toBe("http");
    expect(config.enableFetchHttp).toBe(true);
    expect(config.waterQualityHttpBaseUrl).toBe("http://water-quality-backend.local");
  });

  it("allows feed-only HTTP override without changing the default global mode", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_BASE_URL: "http://feed-backend.local"
    });

    expect(config.mode).toBe("mock");
    expect(config.feedMode).toBe("http");
    expect(config.enableFetchHttp).toBe(true);
    expect(config.feedHttpBaseUrl).toBe("http://feed-backend.local");
  });

  it("defaults alerts-only fetch HTTP mode to the local proxy path", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true"
    });

    expect(resolveAlertsHttpBaseUrl(config)).toBe("");
  });

  it("defaults water-quality-only fetch HTTP mode to the local proxy path", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true"
    });

    expect(resolveWaterQualityHttpBaseUrl(config)).toBe("");
  });

  it("defaults feed-only fetch HTTP mode to the local proxy path", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true"
    });

    expect(resolveFeedHttpBaseUrl(config)).toBe("");
  });

  it("keeps malformed alerts HTTP settings safe and visible through diagnostics", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "false",
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL: "bad-target"
    });
    const diagnostics = getAlertsRuntimeDiagnostics(config);

    expect(config.mode).toBe("mock");
    expect(config.alertsHttpBaseUrl).toBeUndefined();
    expect(diagnostics.effectiveMode).toBe("mock");
    expect(diagnostics.warnings).toContainEqual({
      code: "INVALID_HTTP_URL",
      message:
        "NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL was ignored because it is not a valid http/https URL."
    });
    expect(diagnostics.warnings).toContainEqual({
      code: "ALERTS_HTTP_DISABLED",
      message:
        "Alerts HTTP mode was requested, but no HTTP executor is enabled. Alerts will remain mock-backed."
    });
  });

  it("keeps malformed water-quality HTTP settings safe and visible through diagnostics", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "false",
      NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_BASE_URL: "bad-target"
    });
    const diagnostics = getWaterQualityRuntimeDiagnostics(config);

    expect(config.mode).toBe("mock");
    expect(config.waterQualityHttpBaseUrl).toBeUndefined();
    expect(diagnostics.effectiveMode).toBe("mock");
    expect(diagnostics.warnings).toContainEqual({
      code: "INVALID_HTTP_URL",
      message:
        "NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_BASE_URL was ignored because it is not a valid http/https URL."
    });
    expect(diagnostics.warnings).toContainEqual({
      code: "WATER_QUALITY_HTTP_DISABLED",
      message:
        "Water-quality HTTP mode was requested, but no HTTP executor is enabled. Water-quality will remain mock-backed."
    });
  });

  it("keeps malformed feed HTTP settings safe and visible through diagnostics", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "false",
      NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_BASE_URL: "bad-target"
    });
    const diagnostics = getFeedRuntimeDiagnostics(config);

    expect(config.mode).toBe("mock");
    expect(config.feedHttpBaseUrl).toBeUndefined();
    expect(diagnostics.effectiveMode).toBe("mock");
    expect(diagnostics.warnings).toContainEqual({
      code: "INVALID_HTTP_URL",
      message:
        "NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_BASE_URL was ignored because it is not a valid http/https URL."
    });
    expect(diagnostics.warnings).toContainEqual({
      code: "FEED_HTTP_DISABLED",
      message:
        "Feed HTTP mode was requested, but no HTTP executor is enabled. Feed will remain mock-backed."
    });
  });

  it("supports direct alerts HTTP transport when explicitly configured", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT: "direct",
      NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL: "http://localhost:4000"
    });
    const diagnostics = getAlertsRuntimeDiagnostics(config);

    expect(resolveAlertsHttpBaseUrl(config)).toBe("http://localhost:4000");
    expect(diagnostics.effectiveMode).toBe("http");
    expect(diagnostics.usesLocalProxy).toBe(false);
    expect(diagnostics.targetLabel).toBe("http://localhost:4000/api/alerts");
  });

  it("supports direct water-quality HTTP transport when explicitly configured", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_TRANSPORT: "direct",
      NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_BASE_URL: "http://localhost:4000"
    });
    const diagnostics = getWaterQualityRuntimeDiagnostics(config);

    expect(resolveWaterQualityHttpBaseUrl(config)).toBe("http://localhost:4000");
    expect(diagnostics.effectiveMode).toBe("http");
    expect(diagnostics.usesLocalProxy).toBe(false);
    expect(diagnostics.targetLabel).toBe("http://localhost:4000/api/water-quality");
  });

  it("supports direct feed HTTP transport when explicitly configured", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE: "http",
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
      NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_TRANSPORT: "direct",
      NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_BASE_URL: "http://localhost:4000"
    });
    const diagnostics = getFeedRuntimeDiagnostics(config);

    expect(resolveFeedHttpBaseUrl(config)).toBe("http://localhost:4000");
    expect(diagnostics.effectiveMode).toBe("http");
    expect(diagnostics.usesLocalProxy).toBe(false);
    expect(diagnostics.targetLabel).toBe("http://localhost:4000/api/feed");
  });

  it("keeps the invocation registry aligned with the endpoint catalog", () => {
    const flattened = flattenEndpointInvocationRegistry(endpointInvocationRegistry);

    expect(flattened[aquaPulseEndpointCatalog.ponds.list.id].path).toBe(
      aquaPulseEndpointCatalog.ponds.list.path
    );
    expect(flattened[aquaPulseEndpointCatalog.ai.queryDashboard.id].method).toBe(
      aquaPulseEndpointCatalog.ai.queryDashboard.method
    );
    expect(flattened[aquaPulseEndpointCatalog.alerts.assign.id].path).toBe(
      aquaPulseEndpointCatalog.alerts.assign.path
    );
    expect(flattened[aquaPulseEndpointCatalog.alerts.listSavedViews.id].path).toBe(
      aquaPulseEndpointCatalog.alerts.listSavedViews.path
    );
    expect(flattened[aquaPulseEndpointCatalog.waterQuality.list.id].transport.http).toBe(
      "placeholder_http"
    );
  });
});
