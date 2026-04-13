import { Injectable } from "@nestjs/common";
import type { FeedEntry, ListResponse } from "@aquapulse/types";
import type { CreateFeedDto, QueryFeedDto, UpdateFeedDto } from "../dto";
import type { FeedRepositoryPort } from "../ports/feed-repository.port";

interface FeedRow {
  readonly id: string;
  readonly pond_id: string;
  readonly batch_id?: string;
  readonly feed_type: string;
  readonly quantity_kg: number;
  readonly fed_at: string;
  readonly created_at: string;
  readonly updated_at: string;
}

function mapFeedRowToDomain(row: FeedRow): FeedEntry {
  return {
    id: row.id,
    pondId: row.pond_id,
    batchId: row.batch_id,
    feedType: row.feed_type,
    quantityKg: row.quantity_kg,
    fedAt: row.fed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createPlaceholderFeedRow(): FeedRow {
  return {
    id: "feed-1",
    pond_id: "pond-1",
    batch_id: "batch-1",
    feed_type: "Starter Feed",
    quantity_kg: 35,
    fed_at: "2026-04-13T00:00:00.000Z",
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z"
  };
}

@Injectable()
export class PostgresFeedRepository implements FeedRepositoryPort {
  async create(_input: CreateFeedDto): Promise<FeedEntry> {
    return mapFeedRowToDomain(createPlaceholderFeedRow());
  }

  async update(_id: string, _input: UpdateFeedDto): Promise<FeedEntry> {
    return mapFeedRowToDomain(createPlaceholderFeedRow());
  }

  async getById(_id: string): Promise<FeedEntry> {
    return mapFeedRowToDomain(createPlaceholderFeedRow());
  }

  async list(_query: QueryFeedDto): Promise<ListResponse<FeedEntry>> {
    return {
      items: [mapFeedRowToDomain(createPlaceholderFeedRow())],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
  }
}
