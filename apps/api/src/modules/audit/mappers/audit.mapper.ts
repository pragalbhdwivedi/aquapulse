import type { ApiSuccessEnvelope, AuditEvent, ListResponse } from "@aquapulse/types";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toAuditItemResponse(item: AuditEvent): ApiSuccessEnvelope<AuditEvent> {
  return createItemResponse(item);
}

export function toAuditListResponse(list: ListResponse<AuditEvent>): ApiSuccessEnvelope<ListResponse<AuditEvent>> {
  return createListResponse(list.items, list.page);
}
