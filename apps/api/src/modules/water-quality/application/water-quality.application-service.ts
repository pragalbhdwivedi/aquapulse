import { Inject, Injectable } from "@nestjs/common";
import type { ApiSuccessEnvelope, ListResponse, WaterQualityReading } from "@aquapulse/types";
import type { CreateWaterQualityDto, QueryWaterQualityDto, UpdateWaterQualityDto } from "../dto";
import { WATER_QUALITY_REPOSITORY, type WaterQualityRepositoryPort } from "../ports/water-quality-repository.port";

@Injectable()
export class WaterQualityApplicationService {
  constructor(
    @Inject(WATER_QUALITY_REPOSITORY) private readonly waterQualityRepository: WaterQualityRepositoryPort
  ) {}

  async create(_input: CreateWaterQualityDto): Promise<ApiSuccessEnvelope<WaterQualityReading>> { return { ok: true, data: await this.waterQualityRepository.create(_input) }; }
  async update(_id: string, _input: UpdateWaterQualityDto): Promise<ApiSuccessEnvelope<WaterQualityReading>> { return { ok: true, data: await this.waterQualityRepository.update(_id, _input) }; }
  async list(_query: QueryWaterQualityDto): Promise<ApiSuccessEnvelope<ListResponse<WaterQualityReading>>> { return { ok: true, data: await this.waterQualityRepository.list(_query) }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<WaterQualityReading>> { return { ok: true, data: await this.waterQualityRepository.getById(_id) }; }
}
