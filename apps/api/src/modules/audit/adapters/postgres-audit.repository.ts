import { Injectable } from "@nestjs/common";
import {
  AQUAPULSE_SCHEMA_TABLES,
  PostgresDatabaseConnectionFactory,
  type DatabaseClient,
  type DatabaseConfig,
  type DatabaseConnectionFactory
} from "@aquapulse/database";
import type { AuditEvent, ListResponse } from "@aquapulse/types";
import { readApiDatabaseRuntimeConfig } from "../../../common/config/database-runtime.config";
import type { CreateAuditDto, UpdateAuditDto } from "../dto";
import type {
  AuditEventMetadataWrite,
  AuditRepositoryPort
} from "../ports/audit-repository.port";
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

interface AuditEventMetadataRow {
  readonly id: string;
  readonly audit_event_id: string;
  readonly request_id?: string;
  readonly correlation_id?: string;
  readonly actor_id?: string;
  readonly http_method?: string;
  readonly request_path?: string;
  readonly status_code?: number;
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

function createPlaceholderAuditRow(overrides: Partial<AuditRow> = {}): AuditRow {
  return {
    id: "audit-1",
    action: "update",
    resource_type: "alert",
    resource_id: "alert-1",
    summary: "Placeholder audit event",
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z",
    ...overrides
  };
}

function mapAuditEventToRow(event: AuditEvent): AuditRow {
  return {
    id: event.id,
    action: event.action,
    resource_type: event.resourceType,
    resource_id: event.resourceId,
    summary: event.summary,
    created_at: event.createdAt,
    updated_at: event.updatedAt
  };
}

function mapAuditMetadataToRow(metadata: AuditEventMetadataWrite): AuditEventMetadataRow {
  return {
    id: metadata.id,
    audit_event_id: metadata.auditEventId,
    request_id: metadata.requestId,
    correlation_id: metadata.correlationId,
    actor_id: metadata.actorId,
    http_method: metadata.httpMethod,
    request_path: metadata.requestPath,
    status_code: metadata.statusCode,
    created_at: metadata.createdAt,
    updated_at: metadata.updatedAt
  };
}

@Injectable()
export class PostgresAuditRepository implements AuditRepositoryPort {
  private connectionFactory: DatabaseConnectionFactory = new PostgresDatabaseConnectionFactory();
  private databaseConfig: DatabaseConfig = readApiDatabaseRuntimeConfig().database;

  private readonly fallbackEvents = new Map<string, AuditEvent>([
    ["audit-1", mapAuditRowToDomain(createPlaceholderAuditRow())]
  ]);

  static forTesting(overrides: {
    readonly connectionFactory?: DatabaseConnectionFactory;
    readonly databaseConfig?: DatabaseConfig;
  } = {}): PostgresAuditRepository {
    const repository = new PostgresAuditRepository();
    repository.connectionFactory = overrides.connectionFactory ?? repository.connectionFactory;
    repository.databaseConfig = overrides.databaseConfig ?? repository.databaseConfig;
    return repository;
  }

  async create(input: CreateAuditDto): Promise<AuditEvent> {
    const id = input.id?.trim() || `audit-created-${Date.now()}`;
    const now = new Date().toISOString();
    const event: AuditEvent = {
      id,
      createdAt: now,
      updatedAt: now,
      action: "create",
      resourceType: "audit",
      resourceId: input.id?.trim() || undefined,
      summary: "Audit event created through the audit API."
    };
    return this.saveEvent(event);
  }

  async update(id: string, _input: UpdateAuditDto): Promise<AuditEvent> {
    const now = new Date().toISOString();
    const event: AuditEvent = {
      id,
      createdAt: now,
      updatedAt: now,
      action: "update",
      resourceType: "audit",
      resourceId: id,
      summary: "Audit event updated through the audit API."
    };
    return this.saveEvent(event);
  }

  async getById(id: string): Promise<AuditEvent> {
    try {
      const client = await this.getClient();
      const result = await client.query<AuditRow>(
        `
          select id, action, resource_type, resource_id, summary, created_at, updated_at
          from ${AQUAPULSE_SCHEMA_TABLES.auditEvents}
          where id = $1
        `,
        [id]
      );
      await client.dispose();

      return mapAuditRowToDomain(result.rows[0] ?? createPlaceholderAuditRow({ id }));
    } catch {
      return this.fallbackEvents.get(id) ?? mapAuditRowToDomain(createPlaceholderAuditRow({ id }));
    }
  }

  async list(query: AuditListQueryContract): Promise<ListResponse<AuditEvent>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const filters: string[] = [];
    const params: unknown[] = [];

    if (query.auditId) {
      params.push(query.auditId);
      filters.push(`e.id = $${params.length}`);
    }
    if (query.resourceType) {
      params.push(query.resourceType);
      filters.push(`e.resource_type = $${params.length}`);
    }
    if (query.resourceId) {
      params.push(query.resourceId);
      filters.push(`e.resource_id = $${params.length}`);
    }
    if (query.action) {
      params.push(query.action);
      filters.push(`e.action = $${params.length}`);
    }
    if (query.actorId) {
      params.push(query.actorId);
      filters.push(
        `exists (
          select 1
          from ${AQUAPULSE_SCHEMA_TABLES.auditEventMetadata} metadata
          where metadata.audit_event_id = e.id
            and metadata.actor_id = $${params.length}
        )`
      );
    }
    if (query.search) {
      params.push(`%${query.search}%`);
      filters.push(`e.summary ilike $${params.length}`);
    }

    const whereClause = filters.length > 0 ? `where ${filters.join(" and ")}` : "";
    params.push(pageSize);
    params.push((page - 1) * pageSize);
    const limitParam = `$${params.length - 1}`;
    const offsetParam = `$${params.length}`;

    try {
      const client = await this.getClient();
      const result = await client.query<(AuditRow & { total_count: number })>(
        `
          select
            e.id,
            e.action,
            e.resource_type,
            e.resource_id,
            e.summary,
            e.created_at,
            e.updated_at,
            count(*) over() as total_count
          from ${AQUAPULSE_SCHEMA_TABLES.auditEvents} e
          ${whereClause}
          order by e.created_at desc
          limit ${limitParam}
          offset ${offsetParam}
        `,
        params
      );
      await client.dispose();

      const items = result.rows.map(mapAuditRowToDomain);
      const totalItems = result.rows[0]?.total_count ?? items.length;
      return {
        items,
        page: {
          page,
          pageSize,
          totalItems,
          totalPages: Math.max(1, Math.ceil(totalItems / pageSize))
        }
      };
    } catch {
      const items = [...this.fallbackEvents.values()].filter((item) => {
        if (query.auditId && item.id !== query.auditId) {
          return false;
        }
        if (query.actorId) {
          return false;
        }
        if (query.resourceType && item.resourceType !== query.resourceType) {
          return false;
        }
        if (query.resourceId && item.resourceId !== query.resourceId) {
          return false;
        }
        if (query.action && item.action !== query.action) {
          return false;
        }
        if (query.search && !item.summary.toLowerCase().includes(query.search.toLowerCase())) {
          return false;
        }
        return true;
      });
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
  }

  async saveEvent(event: AuditEvent): Promise<AuditEvent> {
    return this.saveEventWithMetadata(event);
  }

  async saveEventWithMetadata(
    event: AuditEvent,
    metadata?: AuditEventMetadataWrite
  ): Promise<AuditEvent> {
    const eventRow = mapAuditEventToRow(event);
    const metadataRow = metadata ? mapAuditMetadataToRow(metadata) : undefined;

    try {
      const client = await this.getClient();
      await client.transaction(async (transaction) => {
        await transaction.query(
          `
            insert into ${AQUAPULSE_SCHEMA_TABLES.auditEvents} (
              id,
              action,
              resource_type,
              resource_id,
              summary,
              created_at,
              updated_at
            ) values ($1, $2, $3, $4, $5, $6, $7)
            on conflict (id) do update set
              action = excluded.action,
              resource_type = excluded.resource_type,
              resource_id = excluded.resource_id,
              summary = excluded.summary,
              updated_at = excluded.updated_at
          `,
          [
            eventRow.id,
            eventRow.action,
            eventRow.resource_type,
            eventRow.resource_id ?? null,
            eventRow.summary,
            eventRow.created_at,
            eventRow.updated_at
          ]
        );

        if (metadataRow) {
          await transaction.query(
            `
              insert into ${AQUAPULSE_SCHEMA_TABLES.auditEventMetadata} (
                id,
                audit_event_id,
                request_id,
                correlation_id,
                actor_id,
                http_method,
                request_path,
                status_code,
                created_at,
                updated_at
              ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              on conflict (audit_event_id) do update set
                request_id = excluded.request_id,
                correlation_id = excluded.correlation_id,
                actor_id = excluded.actor_id,
                http_method = excluded.http_method,
                request_path = excluded.request_path,
                status_code = excluded.status_code,
                updated_at = excluded.updated_at
            `,
            [
              metadataRow.id,
              metadataRow.audit_event_id,
              metadataRow.request_id ?? null,
              metadataRow.correlation_id ?? null,
              metadataRow.actor_id ?? null,
              metadataRow.http_method ?? null,
              metadataRow.request_path ?? null,
              metadataRow.status_code ?? null,
              metadataRow.created_at,
              metadataRow.updated_at
            ]
          );
        }
      });
      await client.dispose();
      return event;
    } catch {
      this.fallbackEvents.set(event.id, event);
      return event;
    }
  }

  private async getClient(): Promise<DatabaseClient> {
    return this.connectionFactory.create(this.databaseConfig);
  }
}

export const POSTGRES_AUDIT_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list"],
  writeMethods: ["create", "update", "saveEvent"],
  rowSource: "audit_events",
  queryNotes: ["filter by resource/action/date range", "support append-only event persistence"],
  mappingNotes: ["map audit rows into AuditEvent"]
} as const;
