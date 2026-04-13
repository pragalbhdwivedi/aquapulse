import { Inject, Injectable } from "@nestjs/common";
import type { ApiSuccessEnvelope, AttachmentMetadata, ListResponse } from "@aquapulse/types";
import type { CreateAttachmentsDto, QueryAttachmentsDto, UpdateAttachmentsDto } from "../dto";
import { ATTACHMENTS_REPOSITORY, type AttachmentsRepositoryPort } from "../ports/attachments-repository.port";

@Injectable()
export class AttachmentsApplicationService {
  constructor(
    @Inject(ATTACHMENTS_REPOSITORY) private readonly attachmentsRepository: AttachmentsRepositoryPort
  ) {}

  async create(_input: CreateAttachmentsDto): Promise<ApiSuccessEnvelope<AttachmentMetadata>> { return { ok: true, data: await this.attachmentsRepository.create(_input) }; }
  async update(_id: string, _input: UpdateAttachmentsDto): Promise<ApiSuccessEnvelope<AttachmentMetadata>> { return { ok: true, data: await this.attachmentsRepository.update(_id, _input) }; }
  async list(_query: QueryAttachmentsDto): Promise<ApiSuccessEnvelope<ListResponse<AttachmentMetadata>>> { return { ok: true, data: await this.attachmentsRepository.list(_query) }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<AttachmentMetadata>> { return { ok: true, data: await this.attachmentsRepository.getById(_id) }; }
}
