import type { ApiSuccessEnvelope, AttachmentMetadata, ListResponse } from "@aquapulse/types";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toAttachmentsItemResponse(item: AttachmentMetadata): ApiSuccessEnvelope<AttachmentMetadata> {
  return createItemResponse(item);
}

export function toAttachmentsListResponse(
  list: ListResponse<AttachmentMetadata>
): ApiSuccessEnvelope<ListResponse<AttachmentMetadata>> {
  return createListResponse(list.items, list.page);
}
