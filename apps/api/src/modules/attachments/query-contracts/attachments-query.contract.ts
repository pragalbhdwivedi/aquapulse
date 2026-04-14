import type { RepositoryListQuery } from "@aquapulse/database";

export interface AttachmentsListQueryContract extends RepositoryListQuery {
  readonly resourceType?: string;
  readonly resourceId?: string;
}
