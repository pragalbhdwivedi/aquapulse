import { Injectable } from "@nestjs/common";
import type { ApiSuccessEnvelope, AuditEvent, ListResponse } from "@aquapulse/types";
import type { CreateAuditDto, QueryAuditDto, UpdateAuditDto } from "../dto";

const audit: AuditEvent = { id: "audit-1", createdAt: "2026-04-13T00:00:00.000Z", updatedAt: "2026-04-13T00:00:00.000Z", action: "update", resourceType: "alert", resourceId: "alert-1", summary: "Placeholder audit event" };

@Injectable()
export class AuditApplicationService {
  async create(_input: CreateAuditDto): Promise<ApiSuccessEnvelope<AuditEvent>> { return { ok: true, data: audit }; }
  async update(_id: string, _input: UpdateAuditDto): Promise<ApiSuccessEnvelope<AuditEvent>> { return { ok: true, data: audit }; }
  async list(_query: QueryAuditDto): Promise<ApiSuccessEnvelope<ListResponse<AuditEvent>>> { return { ok: true, data: { items: [audit], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } } }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<AuditEvent>> { return { ok: true, data: audit }; }
}
