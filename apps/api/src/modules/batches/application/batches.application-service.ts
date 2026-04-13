import type { ApiSuccessEnvelope, BatchSummary, ListResponse } from "@aquapulse/types";
import type { CreateBatchesDto, QueryBatchesDto, UpdateBatchesDto } from "../dto";

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

export class BatchesApplicationService {
  async create(_input: CreateBatchesDto): Promise<ApiSuccessEnvelope<BatchSummary>> { return { ok: true, data: batch }; }
  async update(_id: string, _input: UpdateBatchesDto): Promise<ApiSuccessEnvelope<BatchSummary>> { return { ok: true, data: batch }; }
  async list(_query: QueryBatchesDto): Promise<ApiSuccessEnvelope<ListResponse<BatchSummary>>> { return { ok: true, data: { items: [batch], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } } }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<BatchSummary>> { return { ok: true, data: batch }; }
}
