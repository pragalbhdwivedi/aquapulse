import type { ApiSuccessEnvelope, ListResponse, WaterQualityReading } from "@aquapulse/types";
import type { CreateWaterQualityDto, QueryWaterQualityDto, UpdateWaterQualityDto } from "../dto";

const reading: WaterQualityReading = { id: "wq-1", createdAt: "2026-04-13T00:00:00.000Z", updatedAt: "2026-04-13T00:00:00.000Z", pondId: "pond-1", recordedAt: "2026-04-13T00:00:00.000Z", temperatureC: 28.4, ph: 7.6 };

export class WaterQualityApplicationService {
  async create(_input: CreateWaterQualityDto): Promise<ApiSuccessEnvelope<WaterQualityReading>> { return { ok: true, data: reading }; }
  async update(_id: string, _input: UpdateWaterQualityDto): Promise<ApiSuccessEnvelope<WaterQualityReading>> { return { ok: true, data: reading }; }
  async list(_query: QueryWaterQualityDto): Promise<ApiSuccessEnvelope<ListResponse<WaterQualityReading>>> { return { ok: true, data: { items: [reading], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } } }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<WaterQualityReading>> { return { ok: true, data: reading }; }
}
