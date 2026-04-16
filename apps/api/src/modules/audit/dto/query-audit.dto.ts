import type { AuditListQueryContract } from "../query-contracts/audit-query.contract";
import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryAuditDto extends QueryFilterBaseDto implements AuditListQueryContract {
  resourceType?: string;
  resourceId?: string;
  action?: "create" | "update" | "delete" | "view" | "export";
}
