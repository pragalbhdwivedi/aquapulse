import type { ApiSuccessEnvelope, AuditEvent, ListResponse } from "@aquapulse/types";
import { toRepositoryListQuery } from "../../../common/dto/repository-query.mapper";
import type { CreateAuditDto, QueryAuditDto, UpdateAuditDto } from "../dto";
import type { AuditListQueryContract } from "../query-contracts/audit-query.contract";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toCreateAuditInput(input: CreateAuditDto): CreateAuditDto {
  return input;
}

export function toUpdateAuditInput(input: UpdateAuditDto): UpdateAuditDto {
  return input;
}

export function toQueryAuditInput(input: QueryAuditDto): AuditListQueryContract {
  return toRepositoryListQuery(input, {
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    action: input.action
  });
}

export function toAuditItemResponse(item: AuditEvent): ApiSuccessEnvelope<AuditEvent> {
  return createItemResponse(item);
}

export function toAuditListResponse(list: ListResponse<AuditEvent>): ApiSuccessEnvelope<ListResponse<AuditEvent>> {
  return createListResponse(list.items, list.page);
}
