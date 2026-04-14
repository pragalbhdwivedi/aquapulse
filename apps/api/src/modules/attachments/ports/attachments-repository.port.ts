import type { AttachmentMetadata, ListResponse } from "@aquapulse/types";
import type { CreateAttachmentsDto, UpdateAttachmentsDto } from "../dto";
import type { AttachmentsListQueryContract } from "../query-contracts/attachments-query.contract";

export const ATTACHMENTS_REPOSITORY = Symbol("ATTACHMENTS_REPOSITORY");

export interface AttachmentsRepositoryPort {
  create(input: CreateAttachmentsDto): Promise<AttachmentMetadata>;
  update(id: string, input: UpdateAttachmentsDto): Promise<AttachmentMetadata>;
  getById(id: string): Promise<AttachmentMetadata>;
  list(query: AttachmentsListQueryContract): Promise<ListResponse<AttachmentMetadata>>;
  listByResource(resourceType: string, resourceId: string): Promise<ListResponse<AttachmentMetadata>>;
}
