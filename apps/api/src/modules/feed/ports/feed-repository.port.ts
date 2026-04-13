import type { FeedEntry, ListResponse } from "@aquapulse/types";
import type { CreateFeedDto, QueryFeedDto, UpdateFeedDto } from "../dto";

export const FEED_REPOSITORY = Symbol("FEED_REPOSITORY");

export interface FeedRepositoryPort {
  create(input: CreateFeedDto): Promise<FeedEntry>;
  update(id: string, input: UpdateFeedDto): Promise<FeedEntry>;
  getById(id: string): Promise<FeedEntry>;
  list(query: QueryFeedDto): Promise<ListResponse<FeedEntry>>;
}
