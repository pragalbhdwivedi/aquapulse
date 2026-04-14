import type {
  ApiSuccessEnvelope,
  FeedCreateRequest,
  FeedEntry,
  FeedUpdateRequest,
  ListResponse
} from "@aquapulse/types";
import { toRepositoryListQuery } from "../../../common/dto/repository-query.mapper";
import type { CreateFeedDto, QueryFeedDto, UpdateFeedDto } from "../dto";
import type { FeedListQueryContract } from "../query-contracts/feed-query.contract";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toCreateFeedInput(input: CreateFeedDto): FeedCreateRequest {
  return {
    pondId: input.pondId,
    batchId: input.batchId,
    feedType: input.feedType,
    quantityKg: input.quantityKg,
    fedAt: input.fedAt
  };
}

export function toUpdateFeedInput(input: UpdateFeedDto): FeedUpdateRequest {
  return {
    batchId: input.batchId,
    feedType: input.feedType,
    quantityKg: input.quantityKg,
    fedAt: input.fedAt
  };
}

export function toQueryFeedInput(input: QueryFeedDto): FeedListQueryContract {
  return toRepositoryListQuery(input, {
    pondId: input.pondId,
    batchId: input.batchId,
    feedType: input.feedType
  });
}

export function toFeedItemResponse(item: FeedEntry): ApiSuccessEnvelope<FeedEntry> {
  return createItemResponse(item);
}

export function toFeedListResponse(list: ListResponse<FeedEntry>): ApiSuccessEnvelope<ListResponse<FeedEntry>> {
  return createListResponse(list.items, list.page);
}
