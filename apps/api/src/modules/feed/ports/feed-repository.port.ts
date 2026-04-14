import type { FeedEntry, ListResponse } from "@aquapulse/types";
import type { CreateFeedDto, UpdateFeedDto } from "../dto";
import type { FeedListQueryContract } from "../query-contracts/feed-query.contract";

export const FEED_REPOSITORY = Symbol("FEED_REPOSITORY");

export interface FeedRepositoryPort {
  create(input: CreateFeedDto): Promise<FeedEntry>;
  update(id: string, input: UpdateFeedDto): Promise<FeedEntry>;
  getById(id: string): Promise<FeedEntry>;
  list(query: FeedListQueryContract): Promise<ListResponse<FeedEntry>>;
}
