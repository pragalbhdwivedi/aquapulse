import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { beforeEach, describe, expect, it } from "vitest";
import { createMockApiClients } from "../clients";
import { createHttpClientFactory } from "../clients/http-client-factory";
import {
  buildHttpRequestFromInvocation,
  buildRoutePath,
  normalizeListQueryToHttpParams,
  serializeQueryParams
} from "../clients/http-request-builders";
import {
  normalizeEmptyListResponse,
  normalizeItemResponse,
  normalizeListResponse
} from "../clients/http-response-normalizers";
import { endpointInvocationRegistry } from "../clients/invocation-registry";
import { createFetchPlaceholderExecutor } from "../clients/http-placeholder";
import { createEndpointHandlersFromClients } from "../clients/endpoint-runtime";
import { resetAlertsMockState } from "../mocks/adapters";

describe("HTTP client factory foundation", () => {
  beforeEach(() => {
    resetAlertsMockState();
  });

  it("keeps explanation cache state isolated across runtime-seam tests", async () => {
    const baseClients = createMockApiClients();
    const executor = createFetchPlaceholderExecutor(createEndpointHandlersFromClients(baseClients));
    const clients = createHttpClientFactory({
      config: { mode: "http", enablePlaceholderHttp: true },
      baseClients,
      executor
    });

    const first = await clients.alerts.explain({
      alertId: "alert-1",
      includeRecommendations: true,
      reuseCached: false
    });
    const second = await clients.alerts.explain({ alertId: "alert-1", includeRecommendations: true });

    expect(first.data.cache.generation).toBe("fresh_fallback");
    expect(second.data.cache.generation).toBe("cached_reuse");
  });

  it("builds expected HTTP-style request shapes from endpoint invocations", () => {
    const request = buildHttpRequestFromInvocation(endpointInvocationRegistry.ponds.getById, {
      id: "pond-1"
    });
    const listParams = normalizeListQueryToHttpParams({
      page: 2,
      pageSize: 25,
      status: "open"
    });

    expect(buildRoutePath("/api/ponds/:id", { id: "pond-1" })).toBe("/api/ponds/pond-1");
    expect(request.path).toBe(aquaPulseEndpointCatalog.ponds.getById.path.replace(":id", "pond-1"));
    expect(listParams?.page).toBe(2);
    expect(serializeQueryParams(listParams)).toContain("page=2");
  });

  it("normalizes item, list, and empty-list responses consistently", () => {
    const item = normalizeItemResponse({
      status: 200,
      body: {
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
      }
    });
    const list = normalizeListResponse({
      status: 200,
      body: {
        ok: true as const,
        data: {
          items: [item.data],
          page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
        }
      }
    });
    const empty = normalizeEmptyListResponse<{ readonly id: string }>({ page: 3, pageSize: 10 });

    expect(item.data.id).toBe("pond-1");
    expect(list.data.page.totalItems).toBe(1);
    expect(empty.data.items).toHaveLength(0);
    expect(empty.data.page.page).toBe(3);
  });

  it("supports readonly HTTP-style clients for pond list/detail, alerts list, and tasks list", async () => {
    const baseClients = createMockApiClients();
    const executor = createFetchPlaceholderExecutor(createEndpointHandlersFromClients(baseClients));
    const clients = createHttpClientFactory({
      config: { mode: "http", enablePlaceholderHttp: true },
      baseClients,
      executor
    });

    const [ponds, pond, alerts, tasks] = await Promise.all([
      clients.ponds.list({ page: 1, pageSize: 20 }),
      clients.ponds.getById("pond-1"),
      clients.alerts.list({ page: 1, pageSize: 20, status: "open" }),
      clients.tasks.list({ page: 1, pageSize: 20 })
    ]);

    expect(ponds.data.items[0]?.id).toBe("pond-1");
    expect(pond.data.id).toBe("pond-1");
    expect(alerts.data.items[0]?.id).toBe("alert-1");
    expect(tasks.data.items[0]?.id).toBe("task-1");
  });

  it("supports alert saved-view methods through the HTTP client factory seam", async () => {
    const baseClients = createMockApiClients();
    const executor = createFetchPlaceholderExecutor(createEndpointHandlersFromClients(baseClients));
    const clients = createHttpClientFactory({
      config: { mode: "http", enablePlaceholderHttp: true, enableFetchHttp: false, alertsMode: "inherit" },
      baseClients,
      executor
    });

    const [listed, saved, removed, explained] = await Promise.all([
      clients.alerts.listSavedViews(),
      clients.alerts.saveSavedView({
        name: "HTTP queue",
        presetId: "all_open",
        query: { page: 1, pageSize: 20, status: "open" }
      }),
      clients.alerts.removeSavedView("alert-view-1"),
      clients.alerts.explain({ alertId: "alert-1", includeRecommendations: true })
    ]);

    expect(Array.isArray(listed.data)).toBe(true);
    expect(Array.isArray(saved.data)).toBe(true);
    expect(Array.isArray(removed.data)).toBe(true);
    expect(explained.data.advisoryDisclaimer).toContain("Advisory only");
    expect(explained.data.cache.status).toBe("fresh");
    expect(explained.data.cache.generation).toBe("fresh_fallback");
  });

  it("supports explanation attachment through the HTTP client factory seam", async () => {
    const baseClients = createMockApiClients();
    const executor = createFetchPlaceholderExecutor(createEndpointHandlersFromClients(baseClients));
    const clients = createHttpClientFactory({
      config: { mode: "http", enablePlaceholderHttp: true },
      baseClients,
      executor
    });

    const explanation = await clients.alerts.explain({ alertId: "alert-1", includeRecommendations: true });
    const attached = await clients.alerts.attachExplanation("alert-1", {
      explanation: explanation.data
    });

    expect(attached.data.actionHistory?.at(-1)?.action).toBe("ai_explanation_snapshot");
    expect(attached.data.latestNote).toContain("AI explanation snapshot");
  });

  it("supports explanation feedback and regeneration controls through the HTTP client factory seam", async () => {
    const baseClients = createMockApiClients();
    const executor = createFetchPlaceholderExecutor(createEndpointHandlersFromClients(baseClients));
    const clients = createHttpClientFactory({
      config: { mode: "http", enablePlaceholderHttp: true },
      baseClients,
      executor
    });

    const first = await clients.alerts.explain({
      alertId: "alert-1",
      includeRecommendations: true,
      reuseCached: false
    });
    const reused = await clients.alerts.explain({ alertId: "alert-1", includeRecommendations: true });
    const regenerated = await clients.alerts.explain({
      alertId: "alert-1",
      includeRecommendations: true,
      reuseCached: false
    });
    const feedback = await clients.alerts.submitExplanationFeedback({
      alertId: "alert-1",
      value: "useful",
      note: "Helpful starting point",
      explanation: regenerated.data
    });
    const afterFeedback = await clients.alerts.explain({ alertId: "alert-1", includeRecommendations: true });

    expect(first.data.cache.generation).toBe("fresh_fallback");
    expect(reused.data.cache.generation).toBe("cached_reuse");
    expect(regenerated.data.cache.generation).toBe("fresh_fallback");
    expect(feedback.data.value).toBe("useful");
    expect(afterFeedback.data.feedbackSummary?.latest?.value).toBe("useful");
  });
});
