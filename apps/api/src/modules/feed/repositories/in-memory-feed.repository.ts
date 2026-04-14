import { Injectable } from "@nestjs/common";
import type { FeedCreateRequest, FeedEntry, FeedUpdateRequest, ListResponse } from "@aquapulse/types";
import type { FeedRepositoryPort } from "../ports/feed-repository.port";
import type { FeedListQueryContract } from "../query-contracts/feed-query.contract";

const baseFeedEntry: FeedEntry = {
  id: "feed-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  pondId: "pond-1",
  batchId: "batch-1",
  feedType: "starter",
  quantityKg: 18,
  fedAt: "2026-04-13T00:00:00.000Z"
};

const feedStore = new WeakMap<InMemoryFeedRepository, FeedEntry[]>();

function getFeedEntries(repository: InMemoryFeedRepository): FeedEntry[] {
  return feedStore.get(repository) ?? [baseFeedEntry];
}

function createPage(items: FeedEntry[], page = 1, pageSize = 20): ListResponse<FeedEntry> {
  return {
    items,
    page: {
      page,
      pageSize,
      totalItems: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize))
    }
  };
}

@Injectable()
export class InMemoryFeedRepository implements FeedRepositoryPort {
  constructor() {
    feedStore.set(this, [baseFeedEntry]);
  }

  async create(input: FeedCreateRequest): Promise<FeedEntry> {
    const entries = getFeedEntries(this);
    const created: FeedEntry = {
      id: `feed-${entries.length + 1}`,
      createdAt: input.fedAt,
      updatedAt: input.fedAt,
      pondId: input.pondId,
      batchId: input.batchId,
      feedType: input.feedType,
      quantityKg: input.quantityKg,
      fedAt: input.fedAt
    };
    entries.unshift(created);
    return created;
  }

  async update(id: string, input: FeedUpdateRequest): Promise<FeedEntry> {
    const entries = getFeedEntries(this);
    const current = entries.find((item) => item.id === id) ?? entries[0];
    const updated: FeedEntry = {
      ...current,
      ...input,
      updatedAt: "2026-04-14T12:30:00.000Z"
    };
    const index = entries.findIndex((item) => item.id === id);
    if (index >= 0) {
      entries[index] = updated;
    }
    return updated;
  }

  async getById(id: string): Promise<FeedEntry> {
    const entries = getFeedEntries(this);
    return entries.find((item) => item.id === id) ?? entries[0];
  }

  async list(query: FeedListQueryContract): Promise<ListResponse<FeedEntry>> {
    const filtered = getFeedEntries(this).filter(
      (item) =>
        (!query.pondId || item.pondId === query.pondId) &&
        (!query.batchId || item.batchId === query.batchId) &&
        (!query.feedType || item.feedType === query.feedType) &&
        (!query.search || item.feedType.toLowerCase().includes(query.search.toLowerCase()))
    );
    return createPage(filtered, query.page, query.pageSize);
  }
}
