import type { AiResponseLogQueryContract } from "../query-contracts/ai-query.contract";
import { QueryFilterBaseDto } from "../../../common/dto/query-filter-base.dto";

export class QueryAiDto extends QueryFilterBaseDto implements AiResponseLogQueryContract {
  requestId?: string;
  status?: "draft" | "completed" | "rejected";
  model?: string;
}
