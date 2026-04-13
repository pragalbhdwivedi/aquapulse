import type { ApiSuccessEnvelope, ListResponse, PondSummary } from "@aquapulse/types";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toPondsItemResponse(item: PondSummary): ApiSuccessEnvelope<PondSummary> {
  return createItemResponse(item);
}

export function toPondsListResponse(list: ListResponse<PondSummary>): ApiSuccessEnvelope<ListResponse<PondSummary>> {
  return createListResponse(list.items, list.page);
}
