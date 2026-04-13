import { Injectable } from "@nestjs/common";
import type { ListResponse, WaterQualityReading } from "@aquapulse/types";
import type { CreateWaterQualityDto, UpdateWaterQualityDto } from "../dto";
import type { WaterQualityRepositoryPort } from "../ports/water-quality-repository.port";
import type { WaterQualityListQueryContract } from "../query-contracts/water-quality-query.contract";

const reading: WaterQualityReading = {
  id: "wq-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  pondId: "pond-1",
  recordedAt: "2026-04-13T00:00:00.000Z",
  temperatureC: 28.4,
  ph: 7.6
};

@Injectable()
export class InMemoryWaterQualityRepository implements WaterQualityRepositoryPort {
  async create(_input: CreateWaterQualityDto): Promise<WaterQualityReading> {
    return reading;
  }

  async update(_id: string, _input: UpdateWaterQualityDto): Promise<WaterQualityReading> {
    return reading;
  }

  async getById(_id: string): Promise<WaterQualityReading> {
    return reading;
  }

  async list(_query: WaterQualityListQueryContract): Promise<ListResponse<WaterQualityReading>> {
    return { items: [reading], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }

  async listByPond(_pondId: string): Promise<ListResponse<WaterQualityReading>> {
    return { items: [reading], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }
}
