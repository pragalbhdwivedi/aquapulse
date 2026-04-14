import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { describe, expect, it } from "vitest";
import { createFetchPlaceholderExecutor } from "../clients/http-placeholder";
import {
  adaptEndpointRequestToHttp,
  adaptHttpResponseToEndpoint,
  createPlaceholderHttpResponse
} from "../clients/http-adapters";
import { createEndpointHandlersFromClients } from "../clients/endpoint-runtime";
import { createMockApiClients } from "../clients";

describe("HTTP placeholder client", () => {
  it("adapts endpoint contracts into placeholder HTTP request and response shapes", async () => {
    const endpoint = aquaPulseEndpointCatalog.ponds.getById;
    const httpRequest = adaptEndpointRequestToHttp(endpoint, { id: "pond-1" });
    const endpointResponse = adaptHttpResponseToEndpoint(
      endpoint,
      createPlaceholderHttpResponse({
        ok: true as const,
        data: {
          id: "pond-1",
          createdAt: "2026-04-13T00:00:00.000Z",
          updatedAt: "2026-04-13T00:00:00.000Z",
          name: "North Pond 1",
          code: "NP-01",
          farmId: "farm-1",
          kind: "pond" as const,
          status: "active" as const
        }
      })
    );

    expect(httpRequest.method).toBe("GET");
    expect(httpRequest.path).toBe("/api/ponds/pond-1");
    expect(endpointResponse.data.id).toBe("pond-1");
  });

  it("executes through the fetch-style placeholder seam without requiring a live backend", async () => {
    const handlers = createEndpointHandlersFromClients(createMockApiClients());
    const execute = createFetchPlaceholderExecutor(handlers);
    const endpoint = aquaPulseEndpointCatalog.alerts.list;
    const request = adaptEndpointRequestToHttp(endpoint, { page: 1, pageSize: 20, status: "open" });
    const response = await execute<typeof endpoint>(request, {
      page: 1,
      pageSize: 20,
      status: "open"
    });

    expect(response.status).toBe(200);
    expect(response.body.data.items[0]?.id).toBe("alert-1");
    expect(response.body.data.page.page).toBe(1);
  });
});
