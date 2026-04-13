import { PaginationDto } from "./pagination.dto";

export class QueryFilterBaseDto extends PaginationDto {
  search?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}
