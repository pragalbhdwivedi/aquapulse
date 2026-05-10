import type { AuditListQueryRequest } from "@aquapulse/types";

export interface AuditListQueryContract extends AuditListQueryRequest {
  readonly auditId?: string;
  readonly actorId?: string;
}
