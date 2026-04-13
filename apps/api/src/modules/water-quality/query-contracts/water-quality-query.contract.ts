import type { RepositoryListQuery } from "@aquapulse/database";

export interface WaterQualityListQueryContract extends RepositoryListQuery {
  readonly pondId?: string;
  readonly metric?: "temperatureC" | "ph";
}
