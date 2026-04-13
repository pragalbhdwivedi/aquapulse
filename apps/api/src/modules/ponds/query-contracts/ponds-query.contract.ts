import type { RepositoryListQuery } from "@aquapulse/database";

export interface PondListQueryContract extends RepositoryListQuery {
  readonly farmId?: string;
  readonly status?: "active" | "maintenance" | "inactive";
  readonly kind?: "pond" | "tank" | "cage";
}
