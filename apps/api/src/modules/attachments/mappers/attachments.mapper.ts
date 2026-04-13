import type { ApiSuccessEnvelope, AttachmentMetadata, ListResponse } from "@aquapulse/types";
import type { CreateAttachmentsDto, QueryAttachmentsDto, UpdateAttachmentsDto } from "../dto";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toCreateAttachmentsInput(input: CreateAttachmentsDto): CreateAttachmentsDto {
  return input;
}

export function toUpdateAttachmentsInput(input: UpdateAttachmentsDto): UpdateAttachmentsDto {
  return input;
}

export function toQueryAttachmentsInput(input: QueryAttachmentsDto): QueryAttachmentsDto {
  return input;
}

export function toAttachmentsItemResponse(item: AttachmentMetadata): ApiSuccessEnvelope<AttachmentMetadata> {
  return createItemResponse(item);
}

export function toAttachmentsListResponse(
  list: ListResponse<AttachmentMetadata>
): ApiSuccessEnvelope<ListResponse<AttachmentMetadata>> {
  return createListResponse(list.items, list.page);
}
