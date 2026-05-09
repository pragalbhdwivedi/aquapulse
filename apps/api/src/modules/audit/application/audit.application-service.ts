import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { ApiSuccessEnvelope, AuditEvent, ListResponse } from "@aquapulse/types";
import { createNotFoundResponse } from "../../../common/api/response-mapper";
import type { CreateAuditDto, UpdateAuditDto } from "../dto";
import { AUDIT_REPOSITORY, type AuditRepositoryPort } from "../ports/audit-repository.port";
import type { AuditListQueryContract } from "../query-contracts/audit-query.contract";

interface AuditReadRequesterScope {
  readonly id: string;
  readonly provider: "keycloak" | "local";
}

function shouldScopeAuditReadsByActor(
  requester: AuditReadRequesterScope | undefined
): requester is AuditReadRequesterScope & { readonly provider: "keycloak" } {
  return requester?.provider === "keycloak" && requester.id.trim().length > 0;
}

@Injectable()
export class AuditApplicationService {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort
  ) {}

  async create(_input: CreateAuditDto): Promise<ApiSuccessEnvelope<AuditEvent>> { return { ok: true, data: await this.auditRepository.create(_input) }; }
  async update(_id: string, _input: UpdateAuditDto): Promise<ApiSuccessEnvelope<AuditEvent>> { return { ok: true, data: await this.auditRepository.update(_id, _input) }; }
  async list(
    query: AuditListQueryContract,
    requester?: AuditReadRequesterScope
  ): Promise<ApiSuccessEnvelope<ListResponse<AuditEvent>>> {
    const scopedQuery: AuditListQueryContract = shouldScopeAuditReadsByActor(requester)
      ? {
          ...query,
          actorId: requester.id
        }
      : query;

    return { ok: true, data: await this.auditRepository.list(scopedQuery) };
  }
  async getById(
    id: string,
    requester?: AuditReadRequesterScope
  ): Promise<ApiSuccessEnvelope<AuditEvent>> {
    if (shouldScopeAuditReadsByActor(requester)) {
      const scopedDetail = await this.auditRepository.list({
        page: 1,
        pageSize: 1,
        auditId: id,
        actorId: requester.id
      });

      const auditEvent = scopedDetail.items[0];
      if (!auditEvent) {
        throw new NotFoundException(createNotFoundResponse("Audit event").error);
      }

      return { ok: true, data: auditEvent };
    }

    return { ok: true, data: await this.auditRepository.getById(id) };
  }
}
