import type { RepositoryListQuery } from "@aquapulse/database";

export interface AuditListQueryContract extends RepositoryListQuery {
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly action?: "create" | "update" | "delete" | "view" | "export";
}
