import type { DateRange, FilterOption, SortOption } from "@aquapulse/types";
import { PaginationDto } from "./pagination.dto";

export class QueryFilterBaseDto extends PaginationDto {
  search?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  sort?: SortOption[];
  filters?: FilterOption[];
  dateRange?: DateRange;
}
