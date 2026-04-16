import type { AttachmentsListQueryContract } from "../query-contracts/attachments-query.contract";
import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryAttachmentsDto extends QueryFilterBaseDto implements AttachmentsListQueryContract {
  resourceType?: string;
  resourceId?: string;
}
