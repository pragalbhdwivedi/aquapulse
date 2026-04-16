import { describe, expect, it, vi } from "vitest";
import type { ListResponse, PondSummary } from "@aquapulse/types";
import { QueryPondsDto } from "../dto";
import { toPondsItemResponse, toPondsListResponse } from "../mappers/ponds.mapper";
import type { PondsRepositoryPort } from "../ports/ponds-repository.port";
import { PondsApplicationService } from "../application/ponds.application-service";
import { PondsController } from "../ponds.controller";

const pond: PondSummary = {
  id: "pond-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  name: "North Pond 1",
  code: "NP-01",
  farmId: "farm-1",
  kind: "pond",
  status: "active"
};

const pondList: ListResponse<PondSummary> = {
  items: [pond],
  page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
};

describe("Ponds contracts", () => {
  it("application service delegates to the persistence port", async () => {
    const repository: PondsRepositoryPort = {
      create: vi.fn().mockResolvedValue(pond),
      update: vi.fn().mockResolvedValue(pond),
      getById: vi.fn().mockResolvedValue(pond),
      list: vi.fn().mockResolvedValue(pondList)
    };

    const service = new PondsApplicationService(repository);
    const result = await service.list(new QueryPondsDto());

    expect(repository.list).toHaveBeenCalledOnce();
    expect(result.data.items[0]?.id).toBe("pond-1");
  });

  it("controller returns the standard list envelope shape", async () => {
    const placeholderService = { getPlaceholder: vi.fn().mockResolvedValue({ ok: true }) };
    const appService = {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn().mockResolvedValue({ ok: true, data: pondList }),
      getById: vi.fn()
    };

    const controller = new PondsController(placeholderService as never, appService as never);
    const response = await controller.list(new QueryPondsDto());

    expect(response.ok).toBe(true);
    expect(response.data.items).toHaveLength(1);
    expect(response.data.page.totalItems).toBe(1);
  });

  it("mapper outputs stable item and list envelopes", () => {
    expect(toPondsItemResponse(pond).data.name).toBe("North Pond 1");
    expect(toPondsListResponse(pondList).data.items[0]?.code).toBe("NP-01");
  });
});
