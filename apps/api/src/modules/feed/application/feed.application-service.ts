import { Inject, Injectable } from "@nestjs/common";
import type { ApiSuccessEnvelope, FeedEntry, ListResponse } from "@aquapulse/types";
import type { CreateFeedDto, QueryFeedDto, UpdateFeedDto } from "../dto";
import { FEED_REPOSITORY, type FeedRepositoryPort } from "../ports/feed-repository.port";

@Injectable()
export class FeedApplicationService {
  constructor(
    @Inject(FEED_REPOSITORY) private readonly feedRepository: FeedRepositoryPort
  ) {}

  async create(_input: CreateFeedDto): Promise<ApiSuccessEnvelope<FeedEntry>> { return { ok: true, data: await this.feedRepository.create(_input) }; }
  async update(_id: string, _input: UpdateFeedDto): Promise<ApiSuccessEnvelope<FeedEntry>> { return { ok: true, data: await this.feedRepository.update(_id, _input) }; }
  async list(_query: QueryFeedDto): Promise<ApiSuccessEnvelope<ListResponse<FeedEntry>>> { return { ok: true, data: await this.feedRepository.list(_query) }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<FeedEntry>> { return { ok: true, data: await this.feedRepository.getById(_id) }; }
}
