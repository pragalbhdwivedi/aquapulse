import { Injectable } from "@nestjs/common";
import type { BatchSummary, ListResponse } from "@aquapulse/types";
import type { CreateBatchesDto, QueryBatchesDto, UpdateBatchesDto } from "../dto";
import type { BatchesRepositoryPort } from "../ports/batches-repository.port";

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

  async list(_query: QueryBatchesDto): Promise<ListResponse<BatchSummary>> {
    return { items: [batch], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }
}
