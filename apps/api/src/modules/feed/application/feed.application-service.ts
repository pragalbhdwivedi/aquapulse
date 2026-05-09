import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  ApiSuccessEnvelope,
  FeedCreateRequest,
  FeedEntry,
  FeedUpdateRequest,
  ListResponse
} from "@aquapulse/types";
import { evaluateFeedAlertDecisions } from "@aquapulse/types";
import { createNotFoundResponse } from "../../../common/api/response-mapper";
import { AlertsApplicationService } from "../../alerts/application/alerts.application-service";
import { PondReadAuthorizationService } from "../../pond-responsibility/application/pond-read-authorization.service";
import { FEED_REPOSITORY, type FeedRepositoryPort } from "../ports/feed-repository.port";
import type { FeedListQueryContract } from "../query-contracts/feed-query.contract";

interface FeedReadRequesterScope {
  readonly id: string;
  readonly provider: "keycloak" | "local";
  readonly roles?: readonly string[];
}

@Injectable()
export class FeedApplicationService {
  constructor(
    @Inject(FEED_REPOSITORY) private readonly feedRepository: FeedRepositoryPort,
    private readonly alertsApplicationService: AlertsApplicationService,
    private readonly pondReadAuthorizationService: PondReadAuthorizationService = new PondReadAuthorizationService({
      canReadPond: async () => true,
      listActiveByUserId: async () => [],
      hasActiveResponsibility: async () => true
    } as never)
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
  async list(
    _query: FeedListQueryContract,
    requester?: FeedReadRequesterScope
  ): Promise<ApiSuccessEnvelope<ListResponse<FeedEntry>>> {
    const readablePondIds = await this.pondReadAuthorizationService.listReadablePondIds(requester);
    const scopedQuery: FeedListQueryContract =
      readablePondIds === undefined
        ? _query
        : {
            ..._query,
            readablePondIds
          };

    return { ok: true, data: await this.feedRepository.list(scopedQuery) };
  }
  async getById(_id: string, requester?: FeedReadRequesterScope): Promise<ApiSuccessEnvelope<FeedEntry>> {
    const entry = await this.feedRepository.getById(_id);
    const canReadPond = await this.pondReadAuthorizationService.canReadPond(requester, entry.pondId);

    if (!canReadPond) {
      throw new NotFoundException(createNotFoundResponse("Feed entry").error);
    }

    return { ok: true, data: entry };
  }
}
