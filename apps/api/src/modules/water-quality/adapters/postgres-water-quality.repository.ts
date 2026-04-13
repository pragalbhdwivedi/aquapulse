import { Injectable } from "@nestjs/common";
import type { ListResponse, WaterQualityReading } from "@aquapulse/types";
import type { CreateWaterQualityDto, UpdateWaterQualityDto } from "../dto";
import type { WaterQualityRepositoryPort } from "../ports/water-quality-repository.port";
import type { WaterQualityListQueryContract } from "../query-contracts/water-quality-query.contract";

interface WaterQualityRow {
  readonly id: string;
  readonly pond_id: string;
  readonly recorded_at: string;
  readonly temperature_c?: number;
  readonly ph?: number;
  readonly created_at: string;
  readonly updated_at: string;
}

function mapWaterQualityRowToDomain(row: WaterQualityRow): WaterQualityReading {
  return {
    id: row.id,
    pondId: row.pond_id,
    recordedAt: row.recorded_at,
    temperatureC: row.temperature_c,
    ph: row.ph,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createPlaceholderWaterQualityRow(): WaterQualityRow {
  return {
    id: "wq-1",
    pond_id: "pond-1",
    recorded_at: "2026-04-13T00:00:00.000Z",
    temperature_c: 28.4,
    ph: 7.6,
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z"
  };
}

@Injectable()
export class PostgresWaterQualityRepository implements WaterQualityRepositoryPort {
  async create(_input: CreateWaterQualityDto): Promise<WaterQualityReading> {
    return mapWaterQualityRowToDomain(createPlaceholderWaterQualityRow());
  }

  async update(_id: string, _input: UpdateWaterQualityDto): Promise<WaterQualityReading> {
    return mapWaterQualityRowToDomain(createPlaceholderWaterQualityRow());
  }

  async getById(_id: string): Promise<WaterQualityReading> {
    return mapWaterQualityRowToDomain(createPlaceholderWaterQualityRow());
  }

  async list(_query: WaterQualityListQueryContract): Promise<ListResponse<WaterQualityReading>> {
    return {
      items: [mapWaterQualityRowToDomain(createPlaceholderWaterQualityRow())],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
  }

  async listByPond(_pondId: string): Promise<ListResponse<WaterQualityReading>> {
    return {
      items: [mapWaterQualityRowToDomain(createPlaceholderWaterQualityRow())],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
  }
}
