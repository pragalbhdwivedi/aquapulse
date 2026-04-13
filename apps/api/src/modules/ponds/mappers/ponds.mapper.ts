import type { ApiSuccessEnvelope, ListResponse, PondSummary } from "@aquapulse/types";
import type { CreatePondsDto, QueryPondsDto, UpdatePondsDto } from "../dto";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toCreatePondsInput(input: CreatePondsDto): CreatePondsDto {
  return input;
}

export function toUpdatePondsInput(input: UpdatePondsDto): UpdatePondsDto {
  return input;
}

export function toQueryPondsInput(input: QueryPondsDto): QueryPondsDto {
  return input;
}

export function toPondsItemResponse(item: PondSummary): ApiSuccessEnvelope<PondSummary> {
  return createItemResponse(item);
}

export function toPondsListResponse(list: ListResponse<PondSummary>): ApiSuccessEnvelope<ListResponse<PondSummary>> {
  return createListResponse(list.items, list.page);
}
