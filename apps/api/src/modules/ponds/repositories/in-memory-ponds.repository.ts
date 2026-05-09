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

function matchesPondQuery(pondItem: PondSummary, query: PondListQueryContract): boolean {
  if (query.readablePondIds && !query.readablePondIds.includes(pondItem.id)) {
    return false;
  }

  if (query.farmId && pondItem.farmId !== query.farmId) {
    return false;
  }

  if (query.status && pondItem.status !== query.status) {
    return false;
  }

  if (query.kind && pondItem.kind !== query.kind) {
    return false;
  }

  if (query.search?.trim()) {
    const haystack = `${pondItem.name} ${pondItem.code}`.toLowerCase();
    if (!haystack.includes(query.search.trim().toLowerCase())) {
      return false;
    }
  }

  return true;
}

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
    const items = matchesPondQuery(pond, _query) ? [pond] : [];
    return {
      items,
      page: {
        page: _query.page,
        pageSize: _query.pageSize,
        totalItems: items.length,
        totalPages: 1
      }
    };
  }
}
