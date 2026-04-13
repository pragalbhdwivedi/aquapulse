import type { ApiSuccessEnvelope, BatchSummary, ListResponse } from "@aquapulse/types";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toBatchesItemResponse(item: BatchSummary): ApiSuccessEnvelope<BatchSummary> {
  return createItemResponse(item);
}

export function toBatchesListResponse(list: ListResponse<BatchSummary>): ApiSuccessEnvelope<ListResponse<BatchSummary>> {
  return createListResponse(list.items, list.page);
}
