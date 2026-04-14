import type { BatchSummary, ListResponse } from "@aquapulse/types";
import type { CreateBatchesDto, UpdateBatchesDto } from "../dto";
import type { BatchesListQueryContract } from "../query-contracts/batches-query.contract";

export const BATCHES_REPOSITORY = Symbol("BATCHES_REPOSITORY");

export interface BatchesRepositoryPort {
  create(input: CreateBatchesDto): Promise<BatchSummary>;
  update(id: string, input: UpdateBatchesDto): Promise<BatchSummary>;
  getById(id: string): Promise<BatchSummary>;
  list(query: BatchesListQueryContract): Promise<ListResponse<BatchSummary>>;
}
