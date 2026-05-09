import { Injectable } from "@nestjs/common";
import type { BatchSummary, ListResponse } from "@aquapulse/types";
import type { CreateBatchesDto, UpdateBatchesDto } from "../dto";
import type { BatchesRepositoryPort } from "../ports/batches-repository.port";
import type { BatchesListQueryContract } from "../query-contracts/batches-query.contract";

const batch: BatchSummary = {
  id: "batch-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  name: "Tilapia Cycle Alpha",
  pondId: "pond-1",
  species: "Tilapia",
  stockCount: 4200,
  lifecycleStage: "growing"
};

function matchesBatchQuery(batchItem: BatchSummary, query: BatchesListQueryContract): boolean {
  if (query.batchId && batchItem.id !== query.batchId) {
    return false;
  }

  if (query.readablePondIds && !query.readablePondIds.includes(batchItem.pondId)) {
    return false;
  }

  if (query.pondId && batchItem.pondId !== query.pondId) {
    return false;
  }

  if (query.lifecycleStage && batchItem.lifecycleStage !== query.lifecycleStage) {
    return false;
  }

  if (query.search?.trim()) {
    const haystack = `${batchItem.name} ${batchItem.species}`.toLowerCase();
    if (!haystack.includes(query.search.trim().toLowerCase())) {
      return false;
    }
  }

  return true;
}

@Injectable()
export class InMemoryBatchesRepository implements BatchesRepositoryPort {
  async create(_input: CreateBatchesDto): Promise<BatchSummary> {
    return batch;
  }

  async update(_id: string, _input: UpdateBatchesDto): Promise<BatchSummary> {
    return batch;
  }

  async getById(_id: string): Promise<BatchSummary> {
    return batch;
  }

  async list(_query: BatchesListQueryContract): Promise<ListResponse<BatchSummary>> {
    const items = matchesBatchQuery(batch, _query) ? [batch] : [];
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
