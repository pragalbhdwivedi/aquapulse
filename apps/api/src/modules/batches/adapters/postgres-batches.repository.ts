import { Injectable } from "@nestjs/common";
import type { BatchSummary, ListResponse } from "@aquapulse/types";
import type { CreateBatchesDto, QueryBatchesDto, UpdateBatchesDto } from "../dto";
import type { BatchesRepositoryPort } from "../ports/batches-repository.port";

interface BatchRow {
  readonly id: string;
  readonly name: string;
  readonly pond_id: string;
  readonly species: string;
  readonly stock_count: number;
  readonly lifecycle_stage: "planned" | "stocked" | "growing" | "harvested";
  readonly created_at: string;
  readonly updated_at: string;
}

function mapBatchRowToDomain(row: BatchRow): BatchSummary {
  return {
    id: row.id,
    name: row.name,
    pondId: row.pond_id,
    species: row.species,
    stockCount: row.stock_count,
    lifecycleStage: row.lifecycle_stage,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createPlaceholderBatchRow(): BatchRow {
  return {
    id: "batch-1",
    name: "Tilapia Cycle Alpha",
    pond_id: "pond-1",
    species: "Tilapia",
    stock_count: 4200,
    lifecycle_stage: "growing",
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z"
  };
}

@Injectable()
export class PostgresBatchesRepository implements BatchesRepositoryPort {
  async create(_input: CreateBatchesDto): Promise<BatchSummary> {
    return mapBatchRowToDomain(createPlaceholderBatchRow());
  }

  async update(_id: string, _input: UpdateBatchesDto): Promise<BatchSummary> {
    return mapBatchRowToDomain(createPlaceholderBatchRow());
  }

  async getById(_id: string): Promise<BatchSummary> {
    return mapBatchRowToDomain(createPlaceholderBatchRow());
  }

  async list(_query: QueryBatchesDto): Promise<ListResponse<BatchSummary>> {
    return {
      items: [mapBatchRowToDomain(createPlaceholderBatchRow())],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
  }
}

export const POSTGRES_BATCHES_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list"],
  writeMethods: ["create", "update"],
  rowSource: "batches",
  queryNotes: ["filter by pond and lifecycle stage", "prepare stock count projections"],
  mappingNotes: ["map batch lifecycle fields into BatchSummary"]
} as const;
