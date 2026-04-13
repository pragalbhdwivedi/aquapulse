import { Injectable } from "@nestjs/common";
import type { AttachmentMetadata, ListResponse } from "@aquapulse/types";
import type { CreateAttachmentsDto, QueryAttachmentsDto, UpdateAttachmentsDto } from "../dto";
import type { AttachmentsRepositoryPort } from "../ports/attachments-repository.port";

interface AttachmentRow {
  readonly id: string;
  readonly resource_type: string;
  readonly resource_id: string;
  readonly file_name: string;
  readonly mime_type: string;
  readonly size_bytes: number;
  readonly created_at: string;
  readonly updated_at: string;
}

function mapAttachmentRowToDomain(row: AttachmentRow): AttachmentMetadata {
  return {
    id: row.id,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createPlaceholderAttachmentRow(): AttachmentRow {
  return {
    id: "attachment-1",
    resource_type: "alert",
    resource_id: "alert-1",
    file_name: "sample-photo.jpg",
    mime_type: "image/jpeg",
    size_bytes: 102400,
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z"
  };
}

@Injectable()
export class PostgresAttachmentsRepository implements AttachmentsRepositoryPort {
  async create(_input: CreateAttachmentsDto): Promise<AttachmentMetadata> {
    return mapAttachmentRowToDomain(createPlaceholderAttachmentRow());
  }

  async update(_id: string, _input: UpdateAttachmentsDto): Promise<AttachmentMetadata> {
    return mapAttachmentRowToDomain(createPlaceholderAttachmentRow());
  }

  async getById(_id: string): Promise<AttachmentMetadata> {
    return mapAttachmentRowToDomain(createPlaceholderAttachmentRow());
  }

  async list(_query: QueryAttachmentsDto): Promise<ListResponse<AttachmentMetadata>> {
    return {
      items: [mapAttachmentRowToDomain(createPlaceholderAttachmentRow())],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
  }

  async listByResource(_resourceType: string, _resourceId: string): Promise<ListResponse<AttachmentMetadata>> {
    return {
      items: [mapAttachmentRowToDomain(createPlaceholderAttachmentRow())],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
  }
}
