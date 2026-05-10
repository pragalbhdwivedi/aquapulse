import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  ApiSuccessEnvelope,
  ListResponse,
  WaterQualityCreateRequest,
  WaterQualityReading
} from "@aquapulse/types";
import { evaluateWaterQualityAlertDecisions } from "@aquapulse/types";
import { createForbiddenResponse, createNotFoundResponse } from "../../../common/api/response-mapper";
import type { CreateWaterQualityDto, UpdateWaterQualityDto } from "../dto";
import { AlertsApplicationService } from "../../alerts/application/alerts.application-service";
import { PondReadAuthorizationService } from "../../pond-responsibility/application/pond-read-authorization.service";
import { WATER_QUALITY_REPOSITORY, type WaterQualityRepositoryPort } from "../ports/water-quality-repository.port";
import type { WaterQualityListQueryContract } from "../query-contracts/water-quality-query.contract";

interface WaterQualityReadRequesterScope {
  readonly id: string;
  readonly provider: "keycloak" | "local";
  readonly roles?: readonly string[];
}

@Injectable()
export class WaterQualityApplicationService {
  constructor(
    @Inject(WATER_QUALITY_REPOSITORY) private readonly waterQualityRepository: WaterQualityRepositoryPort,
    private readonly alertsApplicationService: AlertsApplicationService,
    private readonly pondReadAuthorizationService: PondReadAuthorizationService = new PondReadAuthorizationService({
      canReadPond: async () => true,
      listActiveByUserId: async () => [],
      hasActiveResponsibility: async () => true
    } as never)
  ) {}

  async create(
    input: WaterQualityCreateRequest,
    requester?: WaterQualityReadRequesterScope
  ): Promise<ApiSuccessEnvelope<WaterQualityReading>> {
    await this.assertCanCreateForPond(input.pondId, requester);
    const created = await this.waterQualityRepository.create(input);
    const decisions = evaluateWaterQualityAlertDecisions(input);

    await Promise.all(
      decisions.map((decision) => this.alertsApplicationService.upsertOperationalDecision(decision))
    );

    return { ok: true, data: created };
  }
  async update(
    _id: string,
    _input: UpdateWaterQualityDto,
    requester?: WaterQualityReadRequesterScope
  ): Promise<ApiSuccessEnvelope<WaterQualityReading>> {
    const existing = await this.waterQualityRepository.getById(_id);
    const canReadExistingPond = await this.pondReadAuthorizationService.canReadPond(requester, existing.pondId);

    if (!canReadExistingPond) {
      throw new NotFoundException(createNotFoundResponse("Water-quality reading").error);
    }

    if (_input.pondId && _input.pondId !== existing.pondId) {
      const canReadNewPond = await this.pondReadAuthorizationService.canReadPond(requester, _input.pondId);

      if (!canReadNewPond) {
        throw new ForbiddenException(createForbiddenResponse().error);
      }
    }

    return { ok: true, data: await this.waterQualityRepository.update(_id, _input) };
  }
  async list(
    _query: WaterQualityListQueryContract,
    requester?: WaterQualityReadRequesterScope
  ): Promise<ApiSuccessEnvelope<ListResponse<WaterQualityReading>>> {
    const readablePondIds = await this.pondReadAuthorizationService.listReadablePondIds(requester);
    const scopedQuery: WaterQualityListQueryContract =
      readablePondIds === undefined
        ? _query
        : {
            ..._query,
            readablePondIds
          };

    return { ok: true, data: await this.waterQualityRepository.list(scopedQuery) };
  }
  async getById(
    _id: string,
    requester?: WaterQualityReadRequesterScope
  ): Promise<ApiSuccessEnvelope<WaterQualityReading>> {
    const reading = await this.waterQualityRepository.getById(_id);
    const canReadPond = await this.pondReadAuthorizationService.canReadPond(requester, reading.pondId);

    if (!canReadPond) {
      throw new NotFoundException(createNotFoundResponse("Water-quality reading").error);
    }

    return { ok: true, data: reading };
  }

  private async assertCanCreateForPond(
    pondId: string,
    requester?: WaterQualityReadRequesterScope
  ) {
    const canReadPond = await this.pondReadAuthorizationService.canReadPond(requester, pondId);

    if (!canReadPond) {
      throw new ForbiddenException(createForbiddenResponse().error);
    }
  }
}
