import type { AttachmentMetadata, ListResponse } from "@aquapulse/types";
import type { CreateAttachmentsDto, QueryAttachmentsDto, UpdateAttachmentsDto } from "../dto";

export const ATTACHMENTS_REPOSITORY = Symbol("ATTACHMENTS_REPOSITORY");

export interface AttachmentsRepositoryPort {
  create(input: CreateAttachmentsDto): Promise<AttachmentMetadata>;
  update(id: string, input: UpdateAttachmentsDto): Promise<AttachmentMetadata>;
  getById(id: string): Promise<AttachmentMetadata>;
  list(query: QueryAttachmentsDto): Promise<ListResponse<AttachmentMetadata>>;
  listByResource(resourceType: string, resourceId: string): Promise<ListResponse<AttachmentMetadata>>;
}
