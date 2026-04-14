import { describe, expect, it, vi } from "vitest";
import type { AlertSummary, ListResponse } from "@aquapulse/types";
import { QueryAlertsDto } from "../dto";
import { toAlertsItemResponse, toAlertsListResponse } from "../mappers/alerts.mapper";
import type { AlertsRepositoryPort } from "../ports/alerts-repository.port";
import { AlertsApplicationService } from "../application/alerts.application-service";
import { AlertsController } from "../alerts.controller";

const alert: AlertSummary = {
  id: "alert-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  title: "Low dissolved oxygen warning",
  severity: "high",
  source: "water-quality",
  pondId: "pond-1",
  status: "open"
};

const alertList: ListResponse<AlertSummary> = {
  items: [alert],
  page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
};

describe("Alerts contracts", () => {
  it("application service uses the alerts repository port", async () => {
    const repository: AlertsRepositoryPort = {
      create: vi.fn().mockResolvedValue(alert),
      update: vi.fn().mockResolvedValue(alert),
      acknowledge: vi.fn().mockResolvedValue(alert),
      resolve: vi.fn().mockResolvedValue(alert),
      getById: vi.fn().mockResolvedValue(alert),
      list: vi.fn().mockResolvedValue(alertList),
      listOpen: vi.fn().mockResolvedValue(alertList)
    };

    const service = new AlertsApplicationService(repository);
    const result = await service.getById("alert-1");

    expect(repository.getById).toHaveBeenCalledWith("alert-1");
    expect(result.data.status).toBe("open");
  });

  it("application service delegates lifecycle actions to the alerts repository port", async () => {
    const repository: AlertsRepositoryPort = {
      create: vi.fn().mockResolvedValue(alert),
      update: vi.fn().mockResolvedValue(alert),
      acknowledge: vi.fn().mockResolvedValue({ ...alert, status: "acknowledged" as const }),
      resolve: vi.fn().mockResolvedValue({ ...alert, status: "resolved" as const }),
      getById: vi.fn().mockResolvedValue(alert),
      list: vi.fn().mockResolvedValue(alertList),
      listOpen: vi.fn().mockResolvedValue(alertList)
    };

    const service = new AlertsApplicationService(repository);
    const acknowledged = await service.acknowledge("alert-1", { note: "Checked sensor." });
    const resolved = await service.resolve("alert-1", { note: "Restored." });

    expect(repository.acknowledge).toHaveBeenCalledWith("alert-1", { note: "Checked sensor." });
    expect(repository.resolve).toHaveBeenCalledWith("alert-1", { note: "Restored." });
    expect(acknowledged.data.status).toBe("acknowledged");
    expect(resolved.data.status).toBe("resolved");
  });

  it("controller returns a standard item envelope", async () => {
    const placeholderService = { getPlaceholder: vi.fn().mockResolvedValue({ ok: true }) };
    const appService = {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn(),
      getById: vi.fn().mockResolvedValue({ ok: true, data: alert })
    };

    const controller = new AlertsController(placeholderService as never, appService as never);
    const response = await controller.getById("alert-1");

    expect(response.ok).toBe(true);
    expect(response.data.severity).toBe("high");
  });

  it("mapper keeps alert response shapes consistent", () => {
    expect(toAlertsItemResponse(alert).data.source).toBe("water-quality");
    expect(toAlertsListResponse(alertList).data.items[0]?.title).toContain("oxygen");
  });
});
