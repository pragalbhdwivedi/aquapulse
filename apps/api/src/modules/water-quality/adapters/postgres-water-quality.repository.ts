import { Injectable } from "@nestjs/common";
import {
  createPlaceholderWaterQualityRow,
  waterQualityRowMapper
} from "@aquapulse/database";
import type { ListResponse, WaterQualityReading } from "@aquapulse/types";
import type { CreateWaterQualityDto, UpdateWaterQualityDto } from "../dto";
import type { WaterQualityRepositoryPort } from "../ports/water-quality-repository.port";
import type { WaterQualityListQueryContract } from "../query-contracts/water-quality-query.contract";

@Injectable()
export class PostgresWaterQualityRepository implements WaterQualityRepositoryPort {
  async create(_input: CreateWaterQualityDto): Promise<WaterQualityReading> {
    return waterQualityRowMapper.toDomain(createPlaceholderWaterQualityRow());
  }

  async update(_id: string, _input: UpdateWaterQualityDto): Promise<WaterQualityReading> {
    return waterQualityRowMapper.toDomain(createPlaceholderWaterQualityRow());
  }

  async getById(_id: string): Promise<WaterQualityReading> {
    return waterQualityRowMapper.toDomain(createPlaceholderWaterQualityRow());
  }

  async list(_query: WaterQualityListQueryContract): Promise<ListResponse<WaterQualityReading>> {
    return {
      items: [waterQualityRowMapper.toDomain(createPlaceholderWaterQualityRow())],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
  }

  async listByPond(_pondId: string): Promise<ListResponse<WaterQualityReading>> {
    return {
      items: [waterQualityRowMapper.toDomain(createPlaceholderWaterQualityRow())],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
  }
}

export const POSTGRES_WATER_QUALITY_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list", "listByPond"],
  writeMethods: ["create", "update"],
  rowSource: "water_quality",
  queryNotes: ["support pond/date range filtering", "shape metric-specific sort options around recorded_at"],
  mappingNotes: ["map water_quality rows into WaterQualityReading via the shared database package row mapper"]
} as const;
