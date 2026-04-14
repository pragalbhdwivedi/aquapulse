import { Injectable } from "@nestjs/common";
import type { FeedEntry, ListResponse } from "@aquapulse/types";
import type { CreateFeedDto, UpdateFeedDto } from "../dto";
import type { FeedRepositoryPort } from "../ports/feed-repository.port";
import type { FeedListQueryContract } from "../query-contracts/feed-query.contract";

const feedEntry: FeedEntry = {
  id: "feed-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  pondId: "pond-1",
  batchId: "batch-1",
  feedType: "starter",
  quantityKg: 18,
  fedAt: "2026-04-13T00:00:00.000Z"
};

@Injectable()
export class InMemoryFeedRepository implements FeedRepositoryPort {
  async create(_input: CreateFeedDto): Promise<FeedEntry> {
    return feedEntry;
  }

  async update(_id: string, _input: UpdateFeedDto): Promise<FeedEntry> {
    return feedEntry;
  }

  async getById(_id: string): Promise<FeedEntry> {
    return feedEntry;
  }

  async list(_query: FeedListQueryContract): Promise<ListResponse<FeedEntry>> {
    return { items: [feedEntry], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }
}
