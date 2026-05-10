import { Injectable } from "@nestjs/common";
import type { AuditEvent, ListResponse } from "@aquapulse/types";
import type { CreateAuditDto, UpdateAuditDto } from "../dto";
import type { AuditRepositoryPort } from "../ports/audit-repository.port";
import type { AuditListQueryContract } from "../query-contracts/audit-query.contract";

interface InMemoryAuditRecord {
  readonly event: AuditEvent;
  readonly actorId?: string;
}

const auditRecords: InMemoryAuditRecord[] = [
  {
    event: {
      id: "audit-1",
      createdAt: "2026-04-13T00:00:00.000Z",
      updatedAt: "2026-04-13T00:00:00.000Z",
      action: "update",
      resourceType: "alert",
      resourceId: "alert-1",
      summary: "Operator user-1 updated alert-1"
    },
    actorId: "user-1"
  },
  {
    event: {
      id: "audit-2",
      createdAt: "2026-04-13T01:00:00.000Z",
      updatedAt: "2026-04-13T01:00:00.000Z",
      action: "view",
      resourceType: "task",
      resourceId: "task-2",
      summary: "Operator user-2 viewed task-2"
    },
    actorId: "user-2"
  },
  {
    event: {
      id: "audit-3",
      createdAt: "2026-04-13T02:00:00.000Z",
      updatedAt: "2026-04-13T02:00:00.000Z",
      action: "create",
      resourceType: "audit",
      resourceId: "audit-legacy",
      summary: "Legacy audit event without actor metadata"
    }
  }
];

@Injectable()
export class InMemoryAuditRepository implements AuditRepositoryPort {
  async create(_input: CreateAuditDto): Promise<AuditEvent> {
    return auditRecords[0].event;
  }

  async update(_id: string, _input: UpdateAuditDto): Promise<AuditEvent> {
    return auditRecords[0].event;
  }

  async getById(id: string): Promise<AuditEvent> {
    return auditRecords.find((record) => record.event.id === id)?.event ?? auditRecords[0].event;
  }

  async list(query: AuditListQueryContract): Promise<ListResponse<AuditEvent>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const filteredItems = auditRecords.filter((record) => {
      if (query.auditId && record.event.id !== query.auditId) {
        return false;
      }
      if (query.actorId && record.actorId !== query.actorId) {
        return false;
      }
      if (query.resourceType && record.event.resourceType !== query.resourceType) {
        return false;
      }
      if (query.resourceId && record.event.resourceId !== query.resourceId) {
        return false;
      }
      if (query.action && record.event.action !== query.action) {
        return false;
      }
      if (query.search && !record.event.summary.toLowerCase().includes(query.search.toLowerCase())) {
        return false;
      }
      return true;
    });
    const items = filteredItems.map((record) => record.event);
    const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: pagedItems,
      page: {
        page,
        pageSize,
        totalItems: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / pageSize))
      }
    };
  }

  async saveEvent(event: AuditEvent): Promise<AuditEvent> {
    return event;
  }
}
