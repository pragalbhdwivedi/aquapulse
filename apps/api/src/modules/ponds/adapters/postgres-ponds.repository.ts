import { Injectable } from "@nestjs/common";
import type { ListResponse, PondSummary } from "@aquapulse/types";
import type { CreatePondsDto, UpdatePondsDto } from "../dto";
import type { PondsRepositoryPort } from "../ports/ponds-repository.port";
import type { PondListQueryContract } from "../query-contracts/ponds-query.contract";

interface PondRow {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly farm_id: string;
  readonly kind: "pond" | "tank" | "cage";
  readonly status: "active" | "maintenance" | "inactive";
  readonly created_at: string;
  readonly updated_at: string;
}

function mapPondRowToDomain(row: PondRow): PondSummary {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    farmId: row.farm_id,
    kind: row.kind,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createPlaceholderPondRow(): PondRow {
  return {
    id: "pond-1",
    name: "North Pond 1",
    code: "NP-01",
    farm_id: "farm-1",
    kind: "pond",
    status: "active",
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z"
  };
}

@Injectable()
export class PostgresPondsRepository implements PondsRepositoryPort {
  async create(_input: CreatePondsDto): Promise<PondSummary> {
    // TODO: Persist to ponds table once the database adapter is wired.
    return mapPondRowToDomain(createPlaceholderPondRow());
  }

  async update(_id: string, _input: UpdatePondsDto): Promise<PondSummary> {
    // TODO: Update ponds row by id.
    return mapPondRowToDomain(createPlaceholderPondRow());
  }

  async getById(_id: string): Promise<PondSummary> {
    // TODO: Query ponds row by id.
    return mapPondRowToDomain(createPlaceholderPondRow());
  }

  async list(_query: PondListQueryContract): Promise<ListResponse<PondSummary>> {
    // TODO: Translate the pond query contract into SQL filters and pagination.
    return {
      items: [mapPondRowToDomain(createPlaceholderPondRow())],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
  }
}
