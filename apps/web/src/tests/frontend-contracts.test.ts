import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  AiAlertsExplainResponse,
  AiDashboardQueryResponse,
  ApiSuccessEnvelope,
  ListResponse,
  PondSummary
} from "@aquapulse/types";
import type { AlertsListQuery, PondsListQuery, TasksListQuery } from "../contracts/api";
import { createMockApiClients, type AquaPulseApiClients } from "../clients";
import { getAiHistoryReusePrefill } from "../features/ai-history-reuse";
import {
  createRepositories,
  type AquaPulseRepositories,
  type AlertsRepository,
  type PondsRepository
} from "../repositories";

describe("Frontend contract boundaries", () => {
  it("mock clients satisfy the frontend client contracts", async () => {
    const clients: AquaPulseApiClients = createMockApiClients();
    const response = await clients.ponds.list();

    expect(response.ok).toBe(true);
    expect(response.data.items[0]?.id).toBe("pond-1");
  });

  it("repositories stay aligned with the shared API envelopes", async () => {
    const repositories: AquaPulseRepositories = createRepositories(createMockApiClients());
    const ponds = await repositories.ponds.list({ page: 2, pageSize: 10, status: "active" });
    const explanation = await repositories.alerts.explain({ alertId: "alert-1" });
    const feedback = await repositories.alerts.submitExplanationFeedback({
      alertId: "alert-1",
      value: "useful",
      explanation: explanation.data
    });
    const alertDetail = await repositories.alerts.getById("alert-1");
    const alertSummary = await repositories.alerts.summary({ page: 1, pageSize: 20 });

    expect(ponds.data.items).toHaveLength(1);
    expect(explanation.data.explanation).toContain("Placeholder");
    expect(feedback.data.value).toBe("useful");
    expect(alertDetail.data.id).toBe("alert-1");
    expect(alertSummary.data.totalAlerts).toBeGreaterThan(0);

    expectTypeOf(repositories.ponds).toMatchTypeOf<PondsRepository>();
    expectTypeOf(repositories.alerts).toMatchTypeOf<AlertsRepository>();
    expectTypeOf<typeof ponds>().toEqualTypeOf<ApiSuccessEnvelope<ListResponse<PondSummary>>>();
    expectTypeOf<typeof explanation>().toEqualTypeOf<ApiSuccessEnvelope<AiAlertsExplainResponse>>();
    expect(ponds.data.page.page).toBe(2);
    expect(ponds.data.page.pageSize).toBe(10);
    expect(alertSummary.data.statusCounts.open).toBeGreaterThanOrEqual(1);
  });

  it("AI repository methods keep the dashboard contract stable", async () => {
    const repositories = createRepositories(createMockApiClients());
    const [history, result, rewrite, incidentDraft, approvalNote] = await Promise.all([
      repositories.ai.list({ page: 1, pageSize: 5, providerMode: "fallback" }),
      repositories.ai.queryDashboard({ question: "What needs attention today?" }),
      repositories.ai.rewriteText({
        originalText: "oxygen low north pond rechecked sample taken",
        tone: "operator",
        outputMode: "bilingual"
      }),
      repositories.ai.draftIncident({
        rawOperatorNotes: "oxygen low north pond rechecked sample taken",
        linkedAlertId: "alert-1",
        severity: "high",
        outputMode: "bilingual",
        tone: "operator"
      }),
      repositories.ai.draftApprovalNote({
        recordType: "alert",
        mode: "needs_review",
        promptNote: "Need a supervisor note."
      })
    ]);

    expect(history.data.items.length).toBeGreaterThan(0);
    expect(history.data.items[0]?.providerMode).toBeTruthy();
    expect(getAiHistoryReusePrefill(history.data.items.find((item) => item.requestType === "incident_draft")!))
      .toMatchObject({
        destinationType: "incident_draft",
        advisoryOnly: true
      });
    expect(result.data.answer).toContain("Start with");
    expect(result.data.metadata.taskLabel).toBe("dashboard_assistant_query");
    expect(rewrite.data.metadata.taskLabel).toBe("incident_rewrite");
    expect(rewrite.data.rewrittenEnglish).toContain("Operator note:");
    expect(incidentDraft.data.metadata.taskLabel).toBe("incident_draft");
    expect(incidentDraft.data.draftEnglish).toContain("advisory-only");
    expect(approvalNote.data.metadata.taskLabel).toBe("approval_note_draft");
    expect(approvalNote.data.reviewRequired).toBe(true);
    expectTypeOf<typeof result>().toEqualTypeOf<ApiSuccessEnvelope<AiDashboardQueryResponse>>();
  });

  it("query-capable repository methods stay aligned with normalized list query contracts", async () => {
    const repositories = createRepositories(createMockApiClients());
    const pondsQuery: PondsListQuery = { page: 1, pageSize: 20, farmId: "farm-1", search: "North" };
    const alertsQuery: AlertsListQuery = { page: 1, pageSize: 20, status: "open" };
    const tasksQuery: TasksListQuery = { page: 1, pageSize: 20, assigneeId: "user-1" };

    const [ponds, alerts, tasks] = await Promise.all([
      repositories.ponds.list(pondsQuery),
      repositories.alerts.list(alertsQuery),
      repositories.tasks.list(tasksQuery)
    ]);

    expect(ponds.data.items[0]?.farmId).toBe("farm-1");
    expect(alerts.data.items[0]?.status).toBe("open");
    expect(tasks.data.items[0]?.assigneeId).toBe("user-1");
  });

  it("keeps empty list and pagination semantics compatible with future HTTP-backed flows", async () => {
    const repositories = createRepositories(createMockApiClients());
    const ponds = await repositories.ponds.list({ page: 4, pageSize: 25, search: "missing-result" });
    const audit = await repositories.audit.list({ page: 2, pageSize: 10, search: "missing-result" });

    expect(ponds.data.items).toHaveLength(0);
    expect(ponds.data.page.page).toBe(4);
    expect(ponds.data.page.pageSize).toBe(25);
    expect(ponds.data.page.totalItems).toBe(0);
    expect(ponds.data.page.totalPages).toBe(1);
    expect(audit.data.items).toHaveLength(0);
    expect(audit.data.page.page).toBe(2);
  });
});
