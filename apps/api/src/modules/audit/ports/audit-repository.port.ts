import type { AuditEvent, ListResponse } from "@aquapulse/types";
import type { CreateAuditDto, UpdateAuditDto } from "../dto";
import type { AuditListQueryContract } from "../query-contracts/audit-query.contract";

export const AUDIT_REPOSITORY = Symbol("AUDIT_REPOSITORY");

export interface AuditEventMetadataWrite {
  readonly id: string;
  readonly auditEventId: string;
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly actorId?: string;
  readonly httpMethod?: string;
  readonly requestPath?: string;
  readonly statusCode?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AuditRepositoryPort {
  create(input: CreateAuditDto): Promise<AuditEvent>;
  update(id: string, input: UpdateAuditDto): Promise<AuditEvent>;
  getById(id: string): Promise<AuditEvent>;
  list(query: AuditListQueryContract): Promise<ListResponse<AuditEvent>>;
  saveEvent(event: AuditEvent): Promise<AuditEvent>;
  saveEventWithMetadata?(
    event: AuditEvent,
    metadata?: AuditEventMetadataWrite
  ): Promise<AuditEvent>;
}
