import type { ApiSuccessEnvelope, ListResponse, PondSummary } from "@aquapulse/types";
import type { CreatePondsDto, QueryPondsDto, UpdatePondsDto } from "../dto";

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

export class PondsApplicationService {
  async create(_input: CreatePondsDto): Promise<ApiSuccessEnvelope<PondSummary>> {
    return { ok: true, data: pond };
  }

  async update(_id: string, _input: UpdatePondsDto): Promise<ApiSuccessEnvelope<PondSummary>> {
    return { ok: true, data: pond };
  }

  async list(_query: QueryPondsDto): Promise<ApiSuccessEnvelope<ListResponse<PondSummary>>> {
    return { ok: true, data: { items: [pond], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } } };
  }

  async getById(_id: string): Promise<ApiSuccessEnvelope<PondSummary>> {
    return { ok: true, data: pond };
  }
}
