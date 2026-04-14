import { Inject, Injectable } from "@nestjs/common";
import type {
  ApiSuccessEnvelope,
  FeedCreateRequest,
  FeedEntry,
  FeedUpdateRequest,
  ListResponse
} from "@aquapulse/types";
import { evaluateFeedAlertDecisions } from "@aquapulse/types";
import { AlertsApplicationService } from "../../alerts/application/alerts.application-service";
import { FEED_REPOSITORY, type FeedRepositoryPort } from "../ports/feed-repository.port";
import type { FeedListQueryContract } from "../query-contracts/feed-query.contract";

@Injectable()
export class FeedApplicationService {
  constructor(
    @Inject(FEED_REPOSITORY) private readonly feedRepository: FeedRepositoryPort,
    private readonly alertsApplicationService: AlertsApplicationService
  ) {}

  async create(input: FeedCreateRequest): Promise<ApiSuccessEnvelope<FeedEntry>> {
    const created = await this.feedRepository.create(input);
    const decisions = evaluateFeedAlertDecisions(input);

    await Promise.all(
      decisions.map((decision) => this.alertsApplicationService.upsertOperationalDecision(decision))
    );

    return { ok: true, data: created };
  }
  async update(id: string, input: FeedUpdateRequest): Promise<ApiSuccessEnvelope<FeedEntry>> { return { ok: true, data: await this.feedRepository.update(id, input) }; }
  async list(_query: FeedListQueryContract): Promise<ApiSuccessEnvelope<ListResponse<FeedEntry>>> { return { ok: true, data: await this.feedRepository.list(_query) }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<FeedEntry>> { return { ok: true, data: await this.feedRepository.getById(_id) }; }
}
