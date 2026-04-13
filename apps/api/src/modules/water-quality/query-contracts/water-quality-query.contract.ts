import type { DateRange, FilterOption, PaginationParams, SortOption } from "@aquapulse/types";

export interface WaterQualityListQueryContract extends PaginationParams {
  readonly pondId?: string;
  readonly dateRange?: DateRange;
  readonly metric?: "temperatureC" | "ph";
  readonly sort?: SortOption[];
  readonly filters?: FilterOption<number | string>;
}
