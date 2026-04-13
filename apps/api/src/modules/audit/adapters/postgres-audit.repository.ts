import { Injectable } from "@nestjs/common";
import type { AuditEvent, ListResponse } from "@aquapulse/types";
import type { CreateAuditDto, UpdateAuditDto } from "../dto";
import type { AuditRepositoryPort } from "../ports/audit-repository.port";
import type { AuditListQueryContract } from "../query-contracts/audit-query.contract";

interface AuditRow {
  readonly id: string;
  readonly action: "create" | "update" | "delete" | "view" | "export";
  readonly resource_type: string;
  readonly resource_id?: string;
  readonly summary: string;
  readonly created_at: string;
  readonly updated_at: string;
}

function mapAuditRowToDomain(row: AuditRow): AuditEvent {
  return {
    id: row.id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createPlaceholderAuditRow(): AuditRow {
  return {
    id: "audit-1",
    action: "update",
    resource_type: "alert",
    resource_id: "alert-1",
    summary: "Placeholder audit event",
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z"
  };
}

@Injectable()
export class PostgresAuditRepository implements AuditRepositoryPort {
  async create(_input: CreateAuditDto): Promise<AuditEvent> {
    return mapAuditRowToDomain(createPlaceholderAuditRow());
  }

  async update(_id: string, _input: UpdateAuditDto): Promise<AuditEvent> {
    return mapAuditRowToDomain(createPlaceholderAuditRow());
  }

  async getById(_id: string): Promise<AuditEvent> {
    return mapAuditRowToDomain(createPlaceholderAuditRow());
  }

  async list(_query: AuditListQueryContract): Promise<ListResponse<AuditEvent>> {
    return {
      items: [mapAuditRowToDomain(createPlaceholderAuditRow())],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
  }

  async saveEvent(event: AuditEvent): Promise<AuditEvent> {
    return event;
  }
}
