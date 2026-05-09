import { Injectable } from "@nestjs/common";
import type {
  ListResponse,
  WaterQualityCreateRequest,
  WaterQualityReading
} from "@aquapulse/types";
import type { CreateWaterQualityDto, UpdateWaterQualityDto } from "../dto";
import type { WaterQualityRepositoryPort } from "../ports/water-quality-repository.port";
import type { WaterQualityListQueryContract } from "../query-contracts/water-quality-query.contract";

const baseReading: WaterQualityReading = {
  id: "wq-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  pondId: "pond-1",
  recordedAt: "2026-04-13T00:00:00.000Z",
  temperatureC: 28.4,
  ph: 7.6
};

const readings: WaterQualityReading[] = [baseReading];

function matchesWaterQualityQuery(
  item: WaterQualityReading,
  query: WaterQualityListQueryContract
): boolean {
  if (query.readablePondIds && !query.readablePondIds.includes(item.pondId)) {
    return false;
  }

  if (query.pondId && item.pondId !== query.pondId) {
    return false;
  }

  if (query.metric === "temperatureC" && item.temperatureC === undefined) {
    return false;
  }

  if (query.metric === "ph" && item.ph === undefined) {
    return false;
  }

  return true;
}

function createPage(items: WaterQualityReading[], page = 1, pageSize = 20): ListResponse<WaterQualityReading> {
  return {
    items,
    page: {
      page,
      pageSize,
      totalItems: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize))
    }
  };
}

@Injectable()
export class InMemoryWaterQualityRepository implements WaterQualityRepositoryPort {
  async create(input: WaterQualityCreateRequest): Promise<WaterQualityReading> {
    const createdAt = input.recordedAt || "2026-04-13T00:00:00.000Z";
    const created: WaterQualityReading = {
      id: `wq-${readings.length + 1}`,
      createdAt,
      updatedAt: createdAt,
      pondId: input.pondId,
      recordedAt: input.recordedAt,
      temperatureC: input.temperatureC,
      ph: input.ph
    };
    readings.unshift(created);
    return created;
  }

  async update(id: string, input: UpdateWaterQualityDto): Promise<WaterQualityReading> {
    const current = readings.find((item) => item.id === id) ?? readings[0];
    const updated: WaterQualityReading = {
      ...current,
      ...input,
      updatedAt: "2026-04-14T00:00:00.000Z"
    };
    const index = readings.findIndex((item) => item.id === id);
    if (index >= 0) {
      readings[index] = updated;
    }
    return updated;
  }

  async getById(id: string): Promise<WaterQualityReading> {
    return readings.find((item) => item.id === id) ?? readings[0];
  }

  async list(query: WaterQualityListQueryContract): Promise<ListResponse<WaterQualityReading>> {
    const filtered = readings.filter((item) => matchesWaterQualityQuery(item, query));
    return createPage(filtered, query.page, query.pageSize);
  }

  async listByPond(pondId: string): Promise<ListResponse<WaterQualityReading>> {
    return createPage(readings.filter((item) => item.pondId === pondId));
  }
}
