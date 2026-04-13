import { Injectable } from "@nestjs/common";
import type { ApiSuccessEnvelope, FeedEntry, ListResponse } from "@aquapulse/types";
import type { CreateFeedDto, QueryFeedDto, UpdateFeedDto } from "../dto";

const feed: FeedEntry = { id: "feed-1", createdAt: "2026-04-13T00:00:00.000Z", updatedAt: "2026-04-13T00:00:00.000Z", pondId: "pond-1", batchId: "batch-1", feedType: "Starter Feed", quantityKg: 35, fedAt: "2026-04-13T00:00:00.000Z" };

@Injectable()
export class FeedApplicationService {
  async create(_input: CreateFeedDto): Promise<ApiSuccessEnvelope<FeedEntry>> { return { ok: true, data: feed }; }
  async update(_id: string, _input: UpdateFeedDto): Promise<ApiSuccessEnvelope<FeedEntry>> { return { ok: true, data: feed }; }
  async list(_query: QueryFeedDto): Promise<ApiSuccessEnvelope<ListResponse<FeedEntry>>> { return { ok: true, data: { items: [feed], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } } }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<FeedEntry>> { return { ok: true, data: feed }; }
}
