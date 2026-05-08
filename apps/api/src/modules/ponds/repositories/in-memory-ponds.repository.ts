import { Injectable } from "@nestjs/common";
import type { ListResponse, PondSummary } from "@aquapulse/types";
import type { CreatePondsDto, UpdatePondsDto } from "../dto";
import type { PondsRepositoryPort } from "../ports/ponds-repository.port";
import type { PondListQueryContract } from "../query-contracts/ponds-query.contract";

let pond: PondSummary = {
  id: "pond-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  name: "North Pond 1",
  code: "NP-01",
  farmId: "farm-1",
  kind: "pond",
  status: "active"
};

@Injectable()
export class InMemoryPondsRepository implements PondsRepositoryPort {
  async create(input: CreatePondsDto): Promise<PondSummary> {
    const createdAt = "2026-04-15T06:30:00.000Z";
    pond = {
      id: input.id ?? "pond-2",
      createdAt,
      updatedAt: createdAt,
      name: input.name ?? "New Pond",
      code: input.code ?? "NEW-01",
      farmId: input.farmId ?? "farm-1",
      kind: input.kind ?? "pond",
      status: input.status ?? "active"
    };
    return pond;
  }

  async update(_id: string, _input: UpdatePondsDto): Promise<PondSummary> {
    pond = {
      ...pond,
      ..._input,
      updatedAt: "2026-04-15T07:00:00.000Z"
    };
    return pond;
  }

  async getById(_id: string): Promise<PondSummary> {
    return pond;
  }

  async list(_query: PondListQueryContract): Promise<ListResponse<PondSummary>> {
    return { items: [pond], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }
}
