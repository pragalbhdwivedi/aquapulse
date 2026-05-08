import { describe, expect, it, vi } from "vitest";
import { AuthController } from "../auth.controller";
import { AiController } from "../modules/ai/ai.controller";
import { AlertsController } from "../modules/alerts/alerts.controller";
import { AttachmentsController } from "../modules/attachments/attachments.controller";
import { AuditController } from "../modules/audit/audit.controller";
import { BatchesController } from "../modules/batches/batches.controller";
import { FeedController } from "../modules/feed/feed.controller";
import { PondsController } from "../modules/ponds/ponds.controller";
import { TasksController } from "../modules/tasks/tasks.controller";
import { WaterQualityController } from "../modules/water-quality/water-quality.controller";

describe("HTTP route-handler parity", () => {
  it("returns consistent list envelopes with echoed pagination metadata", async () => {
    const pondList = {
      ok: true as const,
      data: {
        items: [],
        page: { page: 3, pageSize: 50, totalItems: 0, totalPages: 1 }
      }
    };
    const placeholderService = { getPlaceholder: vi.fn().mockResolvedValue({ ok: true }) };

    const pondsController = new PondsController(placeholderService as never, {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn().mockResolvedValue(pondList),
      getById: vi.fn()
    } as never);
    const alertsController = new AlertsController(placeholderService as never, {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn().mockResolvedValue(pondList),
      getById: vi.fn()
    } as never, {
      issueSubscriptionBootstrap: vi.fn()
    } as never);
    const tasksController = new TasksController(placeholderService as never, {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn().mockResolvedValue(pondList),
      getById: vi.fn()
    } as never);

    const [ponds, alerts, tasks] = await Promise.all([
      pondsController.list({ page: 3, pageSize: 50 }),
      alertsController.list({ page: 3, pageSize: 50 }),
      tasksController.list({ page: 3, pageSize: 50 })
    ]);

    expect(ponds).toEqual(pondList);
    expect(alerts.data.page.pageSize).toBe(50);
    expect(tasks.data.items).toHaveLength(0);
  });

  it("keeps empty-state list semantics stable across attachment, batch, feed, audit, and water-quality handlers", async () => {
    const emptyList = {
      ok: true as const,
      data: {
        items: [],
        page: { page: 2, pageSize: 25, totalItems: 0, totalPages: 1 }
      }
    };
    const placeholderService = { getPlaceholder: vi.fn().mockResolvedValue({ ok: true }) };

    const attachmentsController = new AttachmentsController(placeholderService as never, {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn().mockResolvedValue(emptyList),
      getById: vi.fn()
    } as never);
    const batchesController = new BatchesController(placeholderService as never, {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn().mockResolvedValue(emptyList),
      getById: vi.fn()
    } as never);
    const feedController = new FeedController(placeholderService as never, {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn().mockResolvedValue(emptyList),
      getById: vi.fn()
    } as never);
    const auditController = new AuditController(placeholderService as never, {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn().mockResolvedValue(emptyList),
      getById: vi.fn()
    } as never);
    const waterQualityController = new WaterQualityController(placeholderService as never, {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn().mockResolvedValue(emptyList),
      getById: vi.fn()
    } as never);

    const responses = await Promise.all([
      attachmentsController.list({ page: 2, pageSize: 25 }),
      batchesController.list({ page: 2, pageSize: 25 }),
      feedController.list({ page: 2, pageSize: 25 }),
      auditController.list({ page: 2, pageSize: 25 }),
      waterQualityController.list({ page: 2, pageSize: 25 })
    ]);

    for (const response of responses) {
      expect(response.ok).toBe(true);
      expect(response.data.items).toHaveLength(0);
      expect(response.data.page.totalPages).toBe(1);
      expect(response.data.page.page).toBe(2);
    }
  });

  it("keeps AI detail and specialized handlers on item-style success envelopes", async () => {
    const placeholderService = { getPlaceholder: vi.fn().mockResolvedValue({ ok: true }) };
    const aiController = new AiController(placeholderService as never, {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn(),
      getById: vi.fn().mockResolvedValue({ ok: true, data: { id: "ai-response-1" } }),
      explainAlert: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          summary: "Placeholder",
          explanation: "Placeholder",
          recommendations: [],
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
            explanationVersion: "v1",
            generation: "fresh_fallback"
          }
        }
      }),
      summarizePond: vi.fn().mockResolvedValue({ ok: true, data: { summary: "Placeholder", highlights: [] } }),
      generateHandover: vi.fn().mockResolvedValue({ ok: true, data: { summary: "Placeholder", actionItems: [] } }),
      rewriteText: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          originalText: "Placeholder source",
          rewrittenEnglish: "Placeholder rewrite",
          tone: "operator",
          metadata: {
            taskLabel: "incident_rewrite",
            advisoryOnly: true,
            generatedAt: "2026-05-08T00:00:00.000Z",
            mode: "fallback",
            modelLabel: "gpt-5-nano",
            sourceLabel: "test",
            usedLiveOpenAi: false,
            providerPath: "deterministic_fallback"
          },
          audit: {
            requestId: "request-rewrite",
            responseId: "response-rewrite",
            requestLoggedAt: "2026-05-08T00:00:00.000Z",
            responseLoggedAt: "2026-05-08T00:00:00.000Z",
            fallbackUsed: true
          }
        }
      }),
      queryDashboard: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          headline: "Placeholder dashboard assistant headline",
          directAnswer: "Placeholder dashboard assistant answer",
          priorityItems: [],
          supportingFacts: [],
          recommendedNextChecks: [],
          answer: "Placeholder dashboard assistant answer",
          relatedMetrics: [],
          metadata: {
            taskLabel: "dashboard_assistant_query",
            advisoryOnly: true,
            generatedAt: "2026-05-08T00:00:00.000Z",
            mode: "fallback",
            modelLabel: "gpt-5-nano",
            sourceLabel: "test",
            usedLiveOpenAi: false,
            providerPath: "deterministic_fallback"
          },
          audit: {
            requestId: "request-1",
            responseId: "response-1",
            requestLoggedAt: "2026-05-08T00:00:00.000Z",
            responseLoggedAt: "2026-05-08T00:00:00.000Z",
            fallbackUsed: true
          }
        }
      }),
      draftIncident: vi.fn().mockResolvedValue({ ok: true, data: { draftTitle: "Placeholder", draftBody: "Placeholder" } }),
      draftApprovalNote: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          headline: "Placeholder approval note draft",
          draftNote: "Placeholder approval note body",
          rationaleSummary: "Placeholder rationale",
          suggestedNextChecks: [],
          reviewRequired: true,
          metadata: {
            taskLabel: "approval_note_draft",
            advisoryOnly: true,
            generatedAt: "2026-05-08T00:00:00.000Z",
            mode: "fallback",
            modelLabel: "gpt-5-nano",
            sourceLabel: "test",
            usedLiveOpenAi: false,
            providerPath: "deterministic_fallback"
          },
          audit: {
            requestId: "request-2",
            responseId: "response-2",
            requestLoggedAt: "2026-05-08T00:00:00.000Z",
            responseLoggedAt: "2026-05-08T00:00:00.000Z",
            fallbackUsed: true
          }
        }
      })
    } as never);

    const [detail, explain, dashboard, approvalNote] = await Promise.all([
      aiController.getById("ai-response-1"),
      aiController.explainAlert({ alertId: "alert-1" } as never),
      aiController.queryDashboard({ question: "What needs attention?" } as never),
      aiController.draftApprovalNote({ recordType: "alert", mode: "needs_review" } as never)
    ]);

    expect(detail.ok).toBe(true);
    expect(detail.data.id).toBe("ai-response-1");
    expect(explain.data.explanation).toContain("Placeholder");
    expect(dashboard.data.answer).toContain("Placeholder");
    expect(dashboard.data.metadata.taskLabel).toBe("dashboard_assistant_query");
    expect(approvalNote.data.metadata.taskLabel).toBe("approval_note_draft");
  });

  it("keeps the current-session endpoint on an item-style success envelope", async () => {
    const controller = new AuthController({
      getCurrentSession: vi.fn().mockResolvedValue({
        requestedMode: "disabled",
        effectiveMode: "disabled",
        availabilityState: "disabled",
        authSource: "none",
        sessionPresent: false,
        protectedReadSliceLabel: "alerts_list_read",
        protectedReadSliceEnforced: false,
        secondaryProtectedReadSliceLabel: "alerts_detail_read",
        secondaryProtectedReadSliceEnforced: false,
        tertiaryProtectedReadSliceLabel: "alerts_summary_read",
        tertiaryProtectedReadSliceEnforced: false,
        protectedOperatorSliceLabel: "alerts_lifecycle_actions",
        protectedOperatorSliceEnforced: false,
        secondaryProtectedSliceLabel: "alerts_triage_actions",
        secondaryProtectedSliceEnforced: false,
        tertiaryProtectedSliceLabel: "alerts_bulk_actions",
        tertiaryProtectedSliceEnforced: false,
        quaternaryProtectedSliceLabel: "alerts_saved_view_mutations",
        quaternaryProtectedSliceEnforced: false,
        verificationState: "disabled",
        warnings: []
      })
    } as never);

    const response = await controller.getCurrentSession({ headers: {} });

    expect(response.ok).toBe(true);
    expect(response.data.availabilityState).toBe("disabled");
  });
});
