import { Injectable } from "@nestjs/common";
import type { AuditEvent, ListResponse } from "@aquapulse/types";
import type { CreateAuditDto, UpdateAuditDto } from "../dto";
import type { AuditRepositoryPort } from "../ports/audit-repository.port";
import type { AuditListQueryContract } from "../query-contracts/audit-query.contract";

const auditEvent: AuditEvent = {
  id: "audit-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  action: "update",
  resourceType: "alert",
  resourceId: "alert-1",
  summary: "Placeholder audit event"
};

@Injectable()
export class InMemoryAuditRepository implements AuditRepositoryPort {
  async create(_input: CreateAuditDto): Promise<AuditEvent> {
    return auditEvent;
  }

  async update(_id: string, _input: UpdateAuditDto): Promise<AuditEvent> {
    return auditEvent;
  }

  async getById(_id: string): Promise<AuditEvent> {
    return auditEvent;
  }

  async list(_query: AuditListQueryContract): Promise<ListResponse<AuditEvent>> {
    return { items: [auditEvent], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }

  async saveEvent(event: AuditEvent): Promise<AuditEvent> {
    return event;
  }
}
