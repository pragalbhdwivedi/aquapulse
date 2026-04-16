import type { FeedCreateRequest, FeedEntry, FeedUpdateRequest, ListResponse } from "@aquapulse/types";
import type { FeedListQueryContract } from "../query-contracts/feed-query.contract";

export const FEED_REPOSITORY = Symbol("FEED_REPOSITORY");

export interface FeedRepositoryPort {
  create(input: FeedCreateRequest): Promise<FeedEntry>;
  update(id: string, input: FeedUpdateRequest): Promise<FeedEntry>;
  getById(id: string): Promise<FeedEntry>;
  list(query: FeedListQueryContract): Promise<ListResponse<FeedEntry>>;
}
