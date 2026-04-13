import type { BatchSummary, ListResponse } from "@aquapulse/types";
import type { CreateBatchesDto, QueryBatchesDto, UpdateBatchesDto } from "../dto";

export const BATCHES_REPOSITORY = Symbol("BATCHES_REPOSITORY");

export interface BatchesRepositoryPort {
  create(input: CreateBatchesDto): Promise<BatchSummary>;
  update(id: string, input: UpdateBatchesDto): Promise<BatchSummary>;
  getById(id: string): Promise<BatchSummary>;
  list(query: QueryBatchesDto): Promise<ListResponse<BatchSummary>>;
}
