import { Injectable } from "@nestjs/common";
import type { AlertSummary, ApiSuccessEnvelope, ListResponse } from "@aquapulse/types";
import type { CreateAlertsDto, QueryAlertsDto, UpdateAlertsDto } from "../dto";

const alert: AlertSummary = { id: "alert-1", createdAt: "2026-04-13T00:00:00.000Z", updatedAt: "2026-04-13T00:00:00.000Z", title: "Low dissolved oxygen warning", severity: "high", source: "water-quality", pondId: "pond-1", status: "open" };

@Injectable()
export class AlertsApplicationService {
  async create(_input: CreateAlertsDto): Promise<ApiSuccessEnvelope<AlertSummary>> { return { ok: true, data: alert }; }
  async update(_id: string, _input: UpdateAlertsDto): Promise<ApiSuccessEnvelope<AlertSummary>> { return { ok: true, data: alert }; }
  async list(_query: QueryAlertsDto): Promise<ApiSuccessEnvelope<ListResponse<AlertSummary>>> { return { ok: true, data: { items: [alert], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } } }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<AlertSummary>> { return { ok: true, data: alert }; }
}
