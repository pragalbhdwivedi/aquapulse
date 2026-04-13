import type { ApiSuccessEnvelope, FeedEntry, ListResponse } from "@aquapulse/types";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toFeedItemResponse(item: FeedEntry): ApiSuccessEnvelope<FeedEntry> {
  return createItemResponse(item);
}

export function toFeedListResponse(list: ListResponse<FeedEntry>): ApiSuccessEnvelope<ListResponse<FeedEntry>> {
  return createListResponse(list.items, list.page);
}
