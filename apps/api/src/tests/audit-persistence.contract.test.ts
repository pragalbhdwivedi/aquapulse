import { createRecordingConnectionFactory, createTestDatabaseConfig } from "@aquapulse/database";
import { describe, expect, it } from "vitest";
import type { AuditEvent } from "@aquapulse/types";
import { PostgresAuditRepository } from "../modules/audit/adapters/postgres-audit.repository";

describe("Audit persistence foundation", () => {
  it("persists audit events and metadata through the postgres repository seam", async () => {
    const recordedQueries: Array<{ statement: string; params: readonly unknown[] }> = [];
    const events = new Map<string, {
      id: string;
      action: AuditEvent["action"];
      resource_type: string;
      resource_id?: string;
      summary: string;
      created_at: string;
      updated_at: string;
    }>();
    const metadataByEventId = new Map<string, {
      id: string;
      audit_event_id: string;
      request_id?: string;
      correlation_id?: string;
      actor_id?: string;
      http_method?: string;
      request_path?: string;
      status_code?: number;
      created_at: string;
      updated_at: string;
    }>();

    const repository = PostgresAuditRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        resolveRows(statement, params) {
          const normalized = statement.replace(/\s+/g, " ").trim().toLowerCase();

          if (normalized.startsWith("insert into audit_events")) {
            events.set(params[0] as string, {
              id: params[0] as string,
              action: params[1] as AuditEvent["action"],
              resource_type: params[2] as string,
              resource_id: (params[3] as string | null) ?? undefined,
              summary: params[4] as string,
              created_at: params[5] as string,
              updated_at: params[6] as string
            });
            return [];
          }

          if (normalized.startsWith("insert into audit_event_metadata")) {
            metadataByEventId.set(params[1] as string, {
              id: params[0] as string,
              audit_event_id: params[1] as string,
              request_id: (params[2] as string | null) ?? undefined,
              correlation_id: (params[3] as string | null) ?? undefined,
              actor_id: (params[4] as string | null) ?? undefined,
              http_method: (params[5] as string | null) ?? undefined,
              request_path: (params[6] as string | null) ?? undefined,
              status_code: (params[7] as number | null) ?? undefined,
              created_at: params[8] as string,
              updated_at: params[9] as string
            });
            return [];
          }

          if (normalized.includes("from audit_events where id =")) {
            const row = events.get(params[0] as string);
            return row ? [row] : [];
          }

          if (normalized.includes("from audit_events")) {
            return [...events.values()].map((row) => ({
              ...row,
              total_count: events.size
            })) as never[];
          }

          return [];
        }
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const event: AuditEvent = {
      id: "audit-runtime-1",
      createdAt: "2026-05-09T12:00:00.000Z",
      updatedAt: "2026-05-09T12:00:00.000Z",
      action: "update",
      resourceType: "alerts",
      resourceId: "alert-1",
      summary: "UPDATE alerts:alert-1 via /api/alerts/alert-1/acknowledge"
    };

    await repository.saveEventWithMetadata?.(event, {
      id: "audit-meta-1",
      auditEventId: event.id,
      requestId: "request-1",
      correlationId: "correlation-1",
      actorId: "operator-1",
      httpMethod: "POST",
      requestPath: "/api/alerts/alert-1/acknowledge",
      statusCode: 200,
      createdAt: "2026-05-09T12:00:00.000Z",
      updatedAt: "2026-05-09T12:00:00.000Z"
    });

    const listed = await repository.list({ page: 1, pageSize: 20 });
    const item = await repository.getById("audit-runtime-1");

    expect(listed.items[0]?.id).toBe("audit-runtime-1");
    expect(item.resourceType).toBe("alerts");
    expect(metadataByEventId.get("audit-runtime-1")?.actor_id).toBe("operator-1");
    expect(recordedQueries.some((query) => query.statement.includes("insert into audit_events"))).toBe(true);
    expect(recordedQueries.some((query) => query.statement.includes("insert into audit_event_metadata"))).toBe(true);
  });
});
