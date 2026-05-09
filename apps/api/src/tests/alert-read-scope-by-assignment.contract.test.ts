import { NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AlertsApplicationService } from "../modules/alerts/application/alerts.application-service";
import { InMemoryAlertsRepository } from "../modules/alerts/repositories/in-memory-alerts.repository";

const liveUpdatesStub = {
  emit: () => undefined
} as const;

describe("Alert read and triage scope by assignment", () => {
  it("scopes alert list reads to the requesting keycloak operator assignee", async () => {
    const service = new AlertsApplicationService(new InMemoryAlertsRepository(), liveUpdatesStub as never);

    const alerts = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-1", provider: "keycloak" }
    );

    expect(alerts.data.items.length).toBeGreaterThan(0);
    expect(alerts.data.items.every((item) => item.assignedTo === "user-1")).toBe(true);
    expect(alerts.data.items.some((item) => item.id === "alert-1")).toBe(true);
    expect(alerts.data.items.some((item) => item.id === "alert-2")).toBe(false);
    expect(alerts.data.items.some((item) => item.id === "alert-3")).toBe(false);
  });

  it("scopes alert summary reads to the same assigned-alert slice", async () => {
    const service = new AlertsApplicationService(new InMemoryAlertsRepository(), liveUpdatesStub as never);

    const summary = await service.summary(
      { page: 1, pageSize: 20 },
      { id: "user-1", provider: "keycloak" }
    );

    expect(summary.data.totalAlerts).toBe(1);
    expect(summary.data.assignmentCounts.assigned).toBe(1);
    expect(summary.data.assignmentCounts.unassigned).toBe(0);
    expect(summary.data.statusCounts.open).toBe(1);
    expect(summary.data.severityCounts.high).toBe(1);
    expect(summary.data.severityCounts.medium).toBe(0);
  });

  it("returns not found when a keycloak operator requests an alert assigned to someone else", async () => {
    const service = new AlertsApplicationService(new InMemoryAlertsRepository(), liveUpdatesStub as never);

    await expect(
      service.getById("alert-2", { id: "user-1", provider: "keycloak" })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns not found when a keycloak operator requests an unassigned alert", async () => {
    const service = new AlertsApplicationService(new InMemoryAlertsRepository(), liveUpdatesStub as never);

    await expect(
      service.getById("alert-3", { id: "user-1", provider: "keycloak" })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("blocks single-alert triage on out-of-scope alerts", async () => {
    const repository = new InMemoryAlertsRepository();
    const service = new AlertsApplicationService(repository, liveUpdatesStub as never);

    await expect(
      service.acknowledge("alert-2", { note: "Should stay hidden." }, { id: "user-1", provider: "keycloak" })
    ).rejects.toBeInstanceOf(NotFoundException);

    const hiddenAlert = await repository.getById("alert-2");
    expect(hiddenAlert.status).toBe("acknowledged");
    expect(hiddenAlert.latestNote).toBeUndefined();
  });

  it("blocks explanation attachment on out-of-scope alerts", async () => {
    const repository = new InMemoryAlertsRepository();
    const service = new AlertsApplicationService(repository, liveUpdatesStub as never);

    await expect(
      service.attachExplanation(
        "alert-2",
        {
          explanation: {
            headline: "Alert explanation",
            summary: "Scoped explanation",
            explanation: "Scoped explanation body",
            recommendations: [],
            likelyCauses: [],
            likelyFactors: [],
            recommendedChecks: [],
            immediateChecks: [],
            suggestedActions: [],
            escalationConsiderations: [],
            observedFacts: [],
            confidenceNote: "Limited confidence.",
            advisoryDisclaimer: "Advisory only.",
            metadata: {
              mode: "fallback",
              advisoryOnly: true,
              generatedAt: "2026-04-16T10:00:00.000Z",
              modelLabel: "gpt-5-nano",
              sourceLabel: "test",
              usedLiveOpenAi: false,
              providerPath: "deterministic_fallback",
              output: {
                outputMode: "english_only",
                primaryLanguage: "english",
                bilingual: false,
                tone: "operator"
              }
            },
            cache: {
              status: "fresh",
              cachedAt: "2026-04-16T10:00:00.000Z",
              freshness: "fresh",
              explanationVersion: "v1",
              generation: "fresh_fallback"
            }
          }
        },
        { id: "user-1", provider: "keycloak" }
      )
    ).rejects.toBeInstanceOf(NotFoundException);

    const hiddenAlert = await repository.getById("alert-2");
    expect(hiddenAlert.latestNote).toBeUndefined();
  });

  it("blocks bulk triage from affecting any out-of-scope alerts", async () => {
    const repository = new InMemoryAlertsRepository();
    const service = new AlertsApplicationService(repository, liveUpdatesStub as never);

    await expect(
      service.bulkResolve(
        { alertIds: ["alert-1", "alert-2"], note: "Bulk resolve attempt." },
        { id: "user-1", provider: "keycloak" }
      )
    ).rejects.toBeInstanceOf(NotFoundException);

    const visibleAlert = await repository.getById("alert-1");
    const hiddenAlert = await repository.getById("alert-2");
    expect(visibleAlert.status).toBe("open");
    expect(hiddenAlert.status).toBe("acknowledged");
  });

  it("keeps local-safe alert reads and triage broad for development flows", async () => {
    const repository = new InMemoryAlertsRepository();
    const service = new AlertsApplicationService(repository, liveUpdatesStub as never);

    const alerts = await service.list(
      { page: 1, pageSize: 20 },
      { id: "local-operator", provider: "local" }
    );
    const summary = await service.summary(
      { page: 1, pageSize: 20 },
      { id: "local-operator", provider: "local" }
    );
    await service.bulkAcknowledge(
      { alertIds: ["alert-1", "alert-2", "alert-3"], note: "Local-safe bulk acknowledge." },
      { id: "local-operator", provider: "local" }
    );

    expect(alerts.data.items.some((item) => item.id === "alert-1")).toBe(true);
    expect(alerts.data.items.some((item) => item.id === "alert-2")).toBe(true);
    expect(alerts.data.items.some((item) => item.id === "alert-3")).toBe(true);
    expect(summary.data.totalAlerts).toBe(3);
    expect(summary.data.assignmentCounts.unassigned).toBe(1);
    expect((await repository.getById("alert-3")).status).toBe("acknowledged");
  });
});
