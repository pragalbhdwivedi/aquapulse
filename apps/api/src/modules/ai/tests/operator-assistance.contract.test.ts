import { afterEach, describe, expect, it, vi } from "vitest";
import { OperatorAssistanceService } from "../services/operator-assistance.service";

describe("Operator assistance service", () => {
  afterEach(() => {
    delete process.env.AQUAPULSE_AI_OPERATOR_ASSISTANCE_MODE;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_OPERATOR_ASSISTANCE_MODEL;
    vi.unstubAllGlobals();
  });

  function createService() {
    const aiRepository = {
      create: vi.fn(),
      update: vi.fn(),
      getById: vi.fn(),
      list: vi.fn(),
      listRequests: vi.fn(),
      saveFeedbackRecord: vi.fn(),
      listFeedback: vi.fn(),
      getPromptTemplateByKey: vi.fn(),
      listPromptTemplates: vi.fn(),
      saveActionDraft: vi.fn(),
      listActionDrafts: vi.fn(),
      saveRequestRecord: vi.fn(async (record) => record),
      saveResponseRecord: vi.fn(async (record) => record)
    };

    const ponds = {
      list: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          items: [
            {
              id: "pond-1",
              createdAt: "2026-05-08T06:00:00.000Z",
              updatedAt: "2026-05-08T06:00:00.000Z",
              name: "North Pond 1",
              code: "NP-01",
              farmId: "farm-1",
              kind: "pond",
              status: "active"
            }
          ],
          page: { page: 1, pageSize: 50, totalItems: 1, totalPages: 1 }
        }
      })
    };
    const waterQuality = {
      list: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          items: [
            {
              id: "wq-1",
              createdAt: "2026-05-08T07:00:00.000Z",
              updatedAt: "2026-05-08T07:00:00.000Z",
              pondId: "pond-1",
              recordedAt: "2026-05-08T07:00:00.000Z",
              temperatureC: 28.4,
              ph: 7.5
            }
          ],
          page: { page: 1, pageSize: 30, totalItems: 1, totalPages: 1 }
        }
      })
    };
    const alerts = {
      getById: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          id: "alert-1",
          createdAt: "2026-05-08T07:10:00.000Z",
          updatedAt: "2026-05-08T07:10:00.000Z",
          title: "Low dissolved oxygen warning",
          severity: "high",
          source: "water-quality",
          pondId: "pond-1",
          status: "open",
          latestNote: "Repeat sample is pending."
        }
      }),
      list: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          items: [
            {
              id: "alert-1",
              createdAt: "2026-05-08T07:10:00.000Z",
              updatedAt: "2026-05-08T07:10:00.000Z",
              title: "Low dissolved oxygen warning",
              severity: "high",
              source: "water-quality",
              pondId: "pond-1",
              status: "open"
            }
          ],
          page: { page: 1, pageSize: 30, totalItems: 1, totalPages: 1 }
        }
      })
    };
    const feed = {
      list: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          items: [
            {
              id: "feed-1",
              createdAt: "2026-05-08T06:45:00.000Z",
              updatedAt: "2026-05-08T06:45:00.000Z",
              pondId: "pond-1",
              feedType: "Starter Feed",
              quantityKg: 32,
              fedAt: "2026-05-08T06:45:00.000Z"
            }
          ],
          page: { page: 1, pageSize: 30, totalItems: 1, totalPages: 1 }
        }
      })
    };
    const tasks = {
      getById: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          id: "task-1",
          createdAt: "2026-05-08T06:30:00.000Z",
          updatedAt: "2026-05-08T06:30:00.000Z",
          title: "Repeat dissolved oxygen reading",
          status: "todo",
          pondId: "pond-1"
        }
      }),
      list: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          items: [
            {
              id: "task-1",
              createdAt: "2026-05-08T06:30:00.000Z",
              updatedAt: "2026-05-08T06:30:00.000Z",
              title: "Repeat dissolved oxygen reading",
              status: "todo",
              pondId: "pond-1"
            }
          ],
          page: { page: 1, pageSize: 30, totalItems: 1, totalPages: 1 }
        }
      })
    };

    return {
      service: new OperatorAssistanceService(
        aiRepository as never,
        ponds as never,
        waterQuality as never,
        alerts as never,
        feed as never,
        tasks as never
      ),
      aiRepository,
      ponds,
      waterQuality,
      alerts,
      feed,
      tasks
    };
  }

  it("returns a deterministic bounded daily farm summary and logs the request/response path", async () => {
    const { service, aiRepository, ponds, alerts } = createService();

    const summary = await service.generateDailyFarmSummary({
      generatedForDate: "2026-05-08T00:00:00.000Z",
      includeMissingDataSignals: true
    });

    expect(summary.metadata.taskLabel).toBe("daily_farm_summary");
    expect(summary.metadata.mode).toBe("fallback");
    expect(summary.pendingActions.length).toBeGreaterThan(0);
    expect(summary.audit.fallbackUsed).toBe(true);
    expect(aiRepository.saveRequestRecord).toHaveBeenCalledTimes(1);
    expect(aiRepository.saveResponseRecord).toHaveBeenCalledTimes(1);
    expect(ponds.list).toHaveBeenCalled();
    expect(alerts.list).toHaveBeenCalled();
  });

  it("returns a deterministic bounded shift handover and keeps the next-shift note structured", async () => {
    const { service } = createService();

    const handover = await service.generateShiftHandover({
      shiftDate: "2026-05-08T00:00:00.000Z",
      shiftLabel: "Morning shift"
    });

    expect(handover.metadata.taskLabel).toBe("shift_handover_generate");
    expect(handover.metadata.mode).toBe("fallback");
    expect(handover.pendingItems.length).toBeGreaterThan(0);
    expect(handover.nextShiftNote).toBeTruthy();
  });

  it("returns a deterministic bounded dashboard assistant answer with structured facts and checks", async () => {
    const { service, aiRepository, ponds, waterQuality } = createService();

    const dashboard = await service.generateDashboardAssistant({
      question: "Which ponds missed updates today?"
    });

    expect(dashboard.metadata.taskLabel).toBe("dashboard_assistant_query");
    expect(dashboard.metadata.mode).toBe("fallback");
    expect(dashboard.answer).toBe(dashboard.directAnswer);
    expect(dashboard.supportingFacts.length).toBeGreaterThanOrEqual(0);
    expect(dashboard.recommendedNextChecks.length).toBeGreaterThan(0);
    expect(dashboard.audit.fallbackUsed).toBe(true);
    expect(aiRepository.saveRequestRecord).toHaveBeenCalledTimes(1);
    expect(aiRepository.saveResponseRecord).toHaveBeenCalledTimes(1);
    expect(ponds.list).toHaveBeenCalled();
    expect(waterQuality.list).toHaveBeenCalled();
  });

  it("returns a deterministic bounded incident rewrite with optional bilingual output", async () => {
    const { service, aiRepository } = createService();

    const rewrite = await service.rewriteIncident({
      originalText: "oxygen low north pond rechecked aerator and sample taken",
      tone: "audit",
      outputMode: "bilingual",
      linkedRecordType: "alert",
      linkedRecordId: "alert-1"
    });

    expect(rewrite.metadata.taskLabel).toBe("incident_rewrite");
    expect(rewrite.metadata.mode).toBe("fallback");
    expect(rewrite.rewrittenEnglish).toContain("Audit note:");
    expect(rewrite.rewrittenHindi).toBeTruthy();
    expect(rewrite.audit.fallbackUsed).toBe(true);
    expect(aiRepository.saveRequestRecord).toHaveBeenCalledTimes(1);
    expect(aiRepository.saveResponseRecord).toHaveBeenCalledTimes(1);
  });

  it("returns a deterministic bounded approval note draft using linked alert context", async () => {
    const { service, alerts, aiRepository } = createService();
    alerts.getById = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        id: "alert-1",
        createdAt: "2026-05-08T07:10:00.000Z",
        updatedAt: "2026-05-08T07:10:00.000Z",
        title: "Low dissolved oxygen warning",
        severity: "high",
        source: "water-quality",
        pondId: "pond-1",
        status: "open",
        latestNote: "Repeat sample is pending."
      }
    });

    const approvalNote = await service.generateApprovalNoteDraft({
      recordType: "alert",
      recordId: "alert-1",
      mode: "needs_review",
      promptNote: "Supervisor note requested."
    });

    expect(approvalNote.metadata.taskLabel).toBe("approval_note_draft");
    expect(approvalNote.metadata.mode).toBe("fallback");
    expect(approvalNote.reviewRequired).toBe(true);
    expect(approvalNote.draftNote).toContain("Low dissolved oxygen warning");
    expect(aiRepository.saveRequestRecord).toHaveBeenCalledTimes(1);
    expect(aiRepository.saveResponseRecord).toHaveBeenCalledTimes(1);
    expect(alerts.getById).toHaveBeenCalledWith("alert-1");
  });

  it("keeps openai mode config-safe when credentials are missing", () => {
    process.env.AQUAPULSE_AI_OPERATOR_ASSISTANCE_MODE = "openai";

    const { service } = createService();
    const runtime = service.getRuntimeSummary();

    expect(runtime.mode).toBe("fallback");
    expect(runtime.configured).toBe(false);
    expect(runtime.supportedTasks).toContain("dashboard_assistant_query");
    expect(runtime.supportedTasks).toContain("incident_rewrite");
    expect(runtime.supportedTasks).toContain("approval_note_draft");
    expect(runtime.warnings.map((warning) => warning.code)).toContain("OPENAI_API_KEY_MISSING");
  });
});
