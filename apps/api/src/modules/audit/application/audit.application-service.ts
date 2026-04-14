import { Inject, Injectable } from "@nestjs/common";
import type { ApiSuccessEnvelope, AuditEvent, ListResponse } from "@aquapulse/types";
import type { CreateAuditDto, UpdateAuditDto } from "../dto";
import { AUDIT_REPOSITORY, type AuditRepositoryPort } from "../ports/audit-repository.port";
import type { AuditListQueryContract } from "../query-contracts/audit-query.contract";

@Injectable()
export class AuditApplicationService {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort
  ) {}

  async create(_input: CreateAuditDto): Promise<ApiSuccessEnvelope<AuditEvent>> { return { ok: true, data: await this.auditRepository.create(_input) }; }
  async update(_id: string, _input: UpdateAuditDto): Promise<ApiSuccessEnvelope<AuditEvent>> { return { ok: true, data: await this.auditRepository.update(_id, _input) }; }
  async list(_query: AuditListQueryContract): Promise<ApiSuccessEnvelope<ListResponse<AuditEvent>>> { return { ok: true, data: await this.auditRepository.list(_query) }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<AuditEvent>> { return { ok: true, data: await this.auditRepository.getById(_id) }; }
}
