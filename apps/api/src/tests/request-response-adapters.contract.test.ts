import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { describe, expect, it } from "vitest";
import {
  adaptEndpointPathParams,
  adaptEndpointRequest,
  adaptEndpointResponse
} from "../common/http/endpoint-request-response.adapters";
import {
  toPondsItemResponse,
  toPondsListResponse,
  toQueryPondsInput
} from "../modules/ponds/mappers/ponds.mapper";
import { toExplainAlertInput, toAiAlertsExplainResponse } from "../modules/ai/mappers/ai.mapper";

describe("Endpoint request/response adapters", () => {
  it("adapts list-query requests through the backend mapper seam", () => {
    const request = adaptEndpointRequest(
      aquaPulseEndpointCatalog.ponds.list,
      { page: 2, pageSize: 15, farmId: "farm-1", status: "active" as const },
      toQueryPondsInput
    );

    expect(request.page).toBe(2);
    expect(request.pageSize).toBe(15);
    expect(request.farmId).toBe("farm-1");
    expect(request.status).toBe("active");
  });

  it("adapts item and list responses through the backend envelope seam", () => {
    const itemResponse = adaptEndpointResponse(
      aquaPulseEndpointCatalog.ponds.getById,
      {
        id: "pond-1",
        createdAt: "2026-04-13T00:00:00.000Z",
        updatedAt: "2026-04-13T00:00:00.000Z",
        name: "North Pond 1",
        code: "NP-01",
        farmId: "farm-1",
        kind: "pond" as const,
        status: "active" as const
      },
      toPondsItemResponse
    );
    const listResponse = adaptEndpointResponse(
      aquaPulseEndpointCatalog.ponds.list,
      {
        items: [itemResponse.data],
        page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
      },
      toPondsListResponse
    );

    expect(itemResponse.ok).toBe(true);
    expect(listResponse.data.items[0]?.id).toBe("pond-1");
    expect(listResponse.data.page.totalItems).toBe(1);
  });

  it("adapts AI action requests and item responses through the same seam", () => {
    const request = adaptEndpointRequest(
      aquaPulseEndpointCatalog.ai.explainAlert,
      { alertId: "alert-1", includeRecommendations: true },
      toExplainAlertInput
    );
    const response = adaptEndpointResponse(
      aquaPulseEndpointCatalog.ai.explainAlert,
      {
        summary: "Placeholder explanation summary",
        explanation: "Placeholder explanation",
        recommendations: ["Inspect aeration equipment."],
        likelyCauses: [],
        recommendedChecks: [],
        suggestedActions: [],
        confidenceNote: "Limited confidence.",
        advisoryDisclaimer: "Advisory only.",
        metadata: {
          mode: "fallback",
          advisoryOnly: true,
          generatedAt: "2026-04-16T00:00:00.000Z",
          modelLabel: "gpt-5-nano",
          sourceLabel: "test",
          usedLiveOpenAi: false
        },
        cache: {
          status: "fresh",
          cachedAt: "2026-04-16T00:00:00.000Z",
          freshness: "fresh",
          explanationVersion: "v1"
        }
      },
      toAiAlertsExplainResponse
    );
    const pathParams = adaptEndpointPathParams(
      aquaPulseEndpointCatalog.ponds.getById,
      "pond-1",
      (id) => ({ id })
    );

    expect(request.alertId).toBe("alert-1");
    expect(response.data.recommendations).toHaveLength(1);
    expect(pathParams.id).toBe("pond-1");
  });
});
