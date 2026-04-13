import type { AuditEvent, ListResponse } from "@aquapulse/types";
import type { CreateAuditDto, UpdateAuditDto } from "../dto";
import type { AuditListQueryContract } from "../query-contracts/audit-query.contract";

export const AUDIT_REPOSITORY = Symbol("AUDIT_REPOSITORY");

export interface AuditRepositoryPort {
  create(input: CreateAuditDto): Promise<AuditEvent>;
  update(id: string, input: UpdateAuditDto): Promise<AuditEvent>;
  getById(id: string): Promise<AuditEvent>;
  list(query: AuditListQueryContract): Promise<ListResponse<AuditEvent>>;
  saveEvent(event: AuditEvent): Promise<AuditEvent>;
}
