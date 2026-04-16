import type {
  AiAlertsExplainResponse,
  AlertQueueSummary,
  AlertSavedViewDefinition,
  AlertSummary,
  ApiSuccessEnvelope,
  ListResponse
} from "@aquapulse/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRepositoriesFromConfig } from "../repositories";

const alert: AlertSummary = {
  id: "alert-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-16T09:00:00.000Z",
  title: "Low dissolved oxygen warning",
  severity: "high",
  source: "water-quality",
  pondId: "pond-1",
  status: "open",
  reviewState: "unreviewed",
  actionHistory: [{ action: "created", timestamp: "2026-04-13T00:00:00.000Z" }]
};

const explanation: AiAlertsExplainResponse = {
  summary: "Alert alert-1 likely reflects an operational condition that still needs a manual check.",
  explanation: "Placeholder explanation for the current alert.",
  recommendations: ["Inspect aeration equipment.", "Repeat the reading."],
  likelyCauses: [],
  recommendedChecks: [],
  suggestedActions: [],
  confidenceNote: "Confidence is limited because this is a placeholder explanation.",
  advisoryDisclaimer:
    "Advisory only. This explanation does not acknowledge, resolve, assign, or mutate alerts.",
  metadata: {
    mode: "fallback",
    advisoryOnly: true,
    generatedAt: "2026-04-16T09:00:00.000Z",
    modelLabel: "gpt-5-nano",
    sourceLabel: "test_placeholder",
    usedLiveOpenAi: false
  },
  cache: {
    status: "fresh",
    cachedAt: "2026-04-16T09:00:00.000Z",
    freshness: "fresh",
    explanationVersion: "v1"
  }
};

const summary: AlertQueueSummary = {
  totalAlerts: 1,
  statusCounts: { open: 1, acknowledged: 0, resolved: 0 },
  assignmentCounts: { assigned: 0, unassigned: 1 },
  reviewStateCounts: { unreviewed: 1, underReview: 0, reviewed: 0, deferred: 0 },
  noteCounts: { withLatestNote: 0, withoutLatestNote: 1 },
  severityCounts: { low: 0, medium: 0, high: 1, critical: 0 },
  ownerWorkloads: []
};

const savedViews: AlertSavedViewDefinition[] = [
  {
    id: "alert-view-1",
    name: "Open queue",
    presetId: "all_open",
    query: { page: 1, pageSize: 20, status: "open" },
    createdAt: "2026-04-16T09:00:00.000Z",
    updatedAt: "2026-04-16T09:00:00.000Z"
  }
];

function jsonResponse<TBody>(body: TBody) {
  return {
    status: 200,
    async json() {
      return body;
    }
  } as Response;
}

describe("Alerts workbench opt-in HTTP runtime", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps default runtime mock-backed while allowing alerts-only fetch HTTP mode when explicitly enabled", async () => {
    const requests: Array<{ method?: string; url: string; body?: unknown }> = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
      requests.push({ method: init?.method, url, body });

      if (url.endsWith("/api/alerts?page=1&pageSize=20&status=open")) {
        return jsonResponse<ApiSuccessEnvelope<ListResponse<AlertSummary>>>({
          ok: true,
          data: {
            items: [alert],
            page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
          }
        });
      }

      if (url.endsWith("/api/alerts/summary?page=1&pageSize=20")) {
        return jsonResponse<ApiSuccessEnvelope<AlertQueueSummary>>({
          ok: true,
          data: summary
        });
      }

      if (url.endsWith("/api/alerts/alert-1?id=alert-1") || url.endsWith("/api/alerts/alert-1")) {
        return jsonResponse<ApiSuccessEnvelope<AlertSummary>>({
          ok: true,
          data: alert
        });
      }

      if (url.includes("/api/alerts/alert-1/acknowledge")) {
        return jsonResponse<ApiSuccessEnvelope<AlertSummary>>({
          ok: true,
          data: {
            ...alert,
            status: "acknowledged",
            latestNote: body?.body?.note ?? body?.note ?? "HTTP operator note.",
            actionHistory: [
              ...(alert.actionHistory ?? []),
              {
                action: "acknowledged",
                note: body?.body?.note ?? body?.note ?? "HTTP operator note.",
                timestamp: "2026-04-16T09:05:00.000Z"
              }
            ]
          }
        });
      }

      if (url.includes("/api/alerts/bulk/resolve")) {
        return jsonResponse<ApiSuccessEnvelope<{ updatedAlerts: AlertSummary[]; totalRequested: number; totalUpdated: number }>>({
          ok: true,
          data: {
            updatedAlerts: [{ ...alert, status: "resolved" }],
            totalRequested: 1,
            totalUpdated: 1
          }
        });
      }

      if (url.includes("/api/ai/alerts/explain")) {
        return jsonResponse<ApiSuccessEnvelope<AiAlertsExplainResponse>>({
          ok: true,
          data: explanation
        });
      }

      if (url.includes("/api/alerts/views") && !url.includes("/remove")) {
        if (init?.method === "GET") {
          return jsonResponse<ApiSuccessEnvelope<AlertSavedViewDefinition[]>>({
            ok: true,
            data: savedViews
          });
        }

        return jsonResponse<ApiSuccessEnvelope<AlertSavedViewDefinition[]>>({
          ok: true,
          data: [
            ...savedViews,
            {
              id: "alert-view-2",
              name: body?.name ?? "Saved view",
              presetId: body?.presetId,
              query: body?.query ?? {},
              createdAt: "2026-04-16T09:10:00.000Z",
              updatedAt: "2026-04-16T09:10:00.000Z"
            }
          ]
        });
      }

      if (url.includes("/api/alerts/views/alert-view-1/remove")) {
        return jsonResponse<ApiSuccessEnvelope<AlertSavedViewDefinition[]>>({
          ok: true,
          data: []
        });
      }

      throw new Error(`Unhandled fetch request: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const defaultRepositories = createRepositoriesFromConfig({
      mode: "mock",
      enablePlaceholderHttp: false,
      enableFetchHttp: false,
      alertsMode: "inherit"
    });
    const httpRepositories = createRepositoriesFromConfig({
      mode: "mock",
      enablePlaceholderHttp: false,
      enableFetchHttp: true,
      alertsMode: "http"
    });

    const [defaultList, httpList, httpSummary, httpDetail, acknowledged, bulkResolved, explained, listedViews, savedViewResult, removedViews] =
      await Promise.all([
        defaultRepositories.alerts.list({ page: 1, pageSize: 20, status: "open" }),
        httpRepositories.alerts.list({ page: 1, pageSize: 20, status: "open" }),
        httpRepositories.alerts.summary({ page: 1, pageSize: 20 }),
        httpRepositories.alerts.getById("alert-1"),
        httpRepositories.alerts.acknowledge("alert-1", { note: "HTTP operator note." }),
        httpRepositories.alerts.bulkResolve({ alertIds: ["alert-1"], note: "Bulk HTTP resolve." }),
        httpRepositories.alerts.explain({ alertId: "alert-1", includeRecommendations: true }),
        httpRepositories.alerts.listSavedViews(),
        httpRepositories.alerts.saveSavedView({
          name: "Assigned queue",
          presetId: "assigned_to_me",
          query: { page: 1, pageSize: 20, assignedTo: "operator-queue" }
        }),
        httpRepositories.alerts.removeSavedView("alert-view-1")
      ]);

    expect(defaultList.data.items[0]?.id).toBe("alert-1");
    expect(httpList.data.items[0]?.id).toBe("alert-1");
    expect(httpSummary.data.totalAlerts).toBe(1);
    expect(httpDetail.data.id).toBe("alert-1");
    expect(acknowledged.data.status).toBe("acknowledged");
    expect(bulkResolved.data.updatedAlerts[0]?.status).toBe("resolved");
    expect(explained.data.advisoryDisclaimer).toContain("Advisory only");
    expect(listedViews.data[0]?.name).toBe("Open queue");
    expect(savedViewResult.data.some((item) => item.name === "Assigned queue")).toBe(true);
    expect(removedViews.data).toHaveLength(0);
    expect(requests.some((request) => request.url.startsWith("/api/alerts"))).toBe(true);
    expect(requests.some((request) => request.url.endsWith("/api/alerts/views"))).toBe(true);
  });
});
