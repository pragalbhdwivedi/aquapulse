import { Injectable } from "@nestjs/common";
import type { ApiSuccessEnvelope, AttachmentMetadata, ListResponse } from "@aquapulse/types";
import type { CreateAttachmentsDto, QueryAttachmentsDto, UpdateAttachmentsDto } from "../dto";

const attachment: AttachmentMetadata = { id: "attachment-1", createdAt: "2026-04-13T00:00:00.000Z", updatedAt: "2026-04-13T00:00:00.000Z", resourceType: "alert", resourceId: "alert-1", fileName: "sample-photo.jpg", mimeType: "image/jpeg", sizeBytes: 102400 };

@Injectable()
export class AttachmentsApplicationService {
  async create(_input: CreateAttachmentsDto): Promise<ApiSuccessEnvelope<AttachmentMetadata>> { return { ok: true, data: attachment }; }
  async update(_id: string, _input: UpdateAttachmentsDto): Promise<ApiSuccessEnvelope<AttachmentMetadata>> { return { ok: true, data: attachment }; }
  async list(_query: QueryAttachmentsDto): Promise<ApiSuccessEnvelope<ListResponse<AttachmentMetadata>>> { return { ok: true, data: { items: [attachment], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } } }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<AttachmentMetadata>> { return { ok: true, data: attachment }; }
}
