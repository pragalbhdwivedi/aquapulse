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

  it("keeps openai mode config-safe when credentials are missing", () => {
    process.env.AQUAPULSE_AI_OPERATOR_ASSISTANCE_MODE = "openai";

    const { service } = createService();
    const runtime = service.getRuntimeSummary();

    expect(runtime.mode).toBe("fallback");
    expect(runtime.configured).toBe(false);
    expect(runtime.warnings.map((warning) => warning.code)).toContain("OPENAI_API_KEY_MISSING");
  });
});
