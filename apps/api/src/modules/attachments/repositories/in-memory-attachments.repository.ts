import { Injectable } from "@nestjs/common";
import type { AttachmentMetadata, ListResponse } from "@aquapulse/types";
import type { CreateAttachmentsDto, UpdateAttachmentsDto } from "../dto";
import type { AttachmentsRepositoryPort } from "../ports/attachments-repository.port";
import type { AttachmentsListQueryContract } from "../query-contracts/attachments-query.contract";

const attachment: AttachmentMetadata = {
  id: "attachment-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  resourceType: "alert",
  resourceId: "alert-1",
  fileName: "sample-photo.jpg",
  mimeType: "image/jpeg",
  sizeBytes: 102400
};

@Injectable()
export class InMemoryAttachmentsRepository implements AttachmentsRepositoryPort {
  async create(_input: CreateAttachmentsDto): Promise<AttachmentMetadata> {
    return attachment;
  }

  async update(_id: string, _input: UpdateAttachmentsDto): Promise<AttachmentMetadata> {
    return attachment;
  }

  async getById(_id: string): Promise<AttachmentMetadata> {
    return attachment;
  }

  async list(_query: AttachmentsListQueryContract): Promise<ListResponse<AttachmentMetadata>> {
    return { items: [attachment], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }

  async listByResource(_resourceType: string, _resourceId: string): Promise<ListResponse<AttachmentMetadata>> {
    return { items: [attachment], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }
}
