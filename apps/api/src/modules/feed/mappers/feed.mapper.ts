import type { ApiSuccessEnvelope, FeedEntry, ListResponse } from "@aquapulse/types";
import type { CreateFeedDto, QueryFeedDto, UpdateFeedDto } from "../dto";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toCreateFeedInput(input: CreateFeedDto): CreateFeedDto {
  return input;
}

export function toUpdateFeedInput(input: UpdateFeedDto): UpdateFeedDto {
  return input;
}

export function toQueryFeedInput(input: QueryFeedDto): QueryFeedDto {
  return input;
}

export function toFeedItemResponse(item: FeedEntry): ApiSuccessEnvelope<FeedEntry> {
  return createItemResponse(item);
}

export function toFeedListResponse(list: ListResponse<FeedEntry>): ApiSuccessEnvelope<ListResponse<FeedEntry>> {
  return createListResponse(list.items, list.page);
}
