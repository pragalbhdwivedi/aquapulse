import type { ApiSuccessEnvelope, BatchSummary, ListResponse } from "@aquapulse/types";
import { toRepositoryListQuery } from "../../../common/dto/repository-query.mapper";
import type { CreateBatchesDto, QueryBatchesDto, UpdateBatchesDto } from "../dto";
import type { BatchesListQueryContract } from "../query-contracts/batches-query.contract";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toCreateBatchesInput(input: CreateBatchesDto): CreateBatchesDto {
  return input;
}

export function toUpdateBatchesInput(input: UpdateBatchesDto): UpdateBatchesDto {
  return input;
}

export function toQueryBatchesInput(input: QueryBatchesDto): BatchesListQueryContract {
  return toRepositoryListQuery(input, {
    pondId: input.pondId,
    lifecycleStage: input.lifecycleStage
  });
}

export function toBatchesItemResponse(item: BatchSummary): ApiSuccessEnvelope<BatchSummary> {
  return createItemResponse(item);
}

export function toBatchesListResponse(list: ListResponse<BatchSummary>): ApiSuccessEnvelope<ListResponse<BatchSummary>> {
  return createListResponse(list.items, list.page);
}
