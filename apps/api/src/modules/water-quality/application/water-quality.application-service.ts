import { Inject, Injectable } from "@nestjs/common";
import type {
  ApiSuccessEnvelope,
  ListResponse,
  WaterQualityCreateRequest,
  WaterQualityReading
} from "@aquapulse/types";
import type { CreateWaterQualityDto, UpdateWaterQualityDto } from "../dto";
import { WATER_QUALITY_REPOSITORY, type WaterQualityRepositoryPort } from "../ports/water-quality-repository.port";
import type { WaterQualityListQueryContract } from "../query-contracts/water-quality-query.contract";

@Injectable()
export class WaterQualityApplicationService {
  constructor(
    @Inject(WATER_QUALITY_REPOSITORY) private readonly waterQualityRepository: WaterQualityRepositoryPort
  ) {}

  async create(
    input: WaterQualityCreateRequest
  ): Promise<ApiSuccessEnvelope<WaterQualityReading>> {
    return { ok: true, data: await this.waterQualityRepository.create(input) };
  }
  async update(_id: string, _input: UpdateWaterQualityDto): Promise<ApiSuccessEnvelope<WaterQualityReading>> { return { ok: true, data: await this.waterQualityRepository.update(_id, _input) }; }
  async list(_query: WaterQualityListQueryContract): Promise<ApiSuccessEnvelope<ListResponse<WaterQualityReading>>> { return { ok: true, data: await this.waterQualityRepository.list(_query) }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<WaterQualityReading>> { return { ok: true, data: await this.waterQualityRepository.getById(_id) }; }
}
