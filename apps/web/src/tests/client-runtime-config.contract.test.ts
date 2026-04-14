import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { describe, expect, it } from "vitest";
import { createApiClientsFromConfig, createApiClientsFromEnv } from "../clients";
import {
  endpointInvocationRegistry,
  flattenEndpointInvocationRegistry
} from "../clients/invocation-registry";
import {
  getDefaultClientRuntimeConfig,
  parseClientRuntimeConfig
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
    const response = await clients.alerts.list({ page: 1, pageSize: 20, status: "open" });

    expect(config.mode).toBe("http");
    expect(response.data.items[0]?.id).toBe("alert-1");
  });

  it("keeps the invocation registry aligned with the endpoint catalog", () => {
    const flattened = flattenEndpointInvocationRegistry(endpointInvocationRegistry);

    expect(flattened[aquaPulseEndpointCatalog.ponds.list.id].path).toBe(
      aquaPulseEndpointCatalog.ponds.list.path
    );
    expect(flattened[aquaPulseEndpointCatalog.ai.queryDashboard.id].method).toBe(
      aquaPulseEndpointCatalog.ai.queryDashboard.method
    );
    expect(flattened[aquaPulseEndpointCatalog.waterQuality.list.id].transport.http).toBe(
      "placeholder_http"
    );
  });
});
