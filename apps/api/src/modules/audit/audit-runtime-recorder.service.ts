import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { PostgresAuditRepository } from "./adapters/postgres-audit.repository";
import { setActiveAuditRuntimeRecorder } from "../../common/audit/audit-runtime-recorder";
import {
  AUDIT_REPOSITORY,
  type AuditRepositoryPort
} from "./ports/audit-repository.port";

@Injectable()
export class AuditRuntimeRecorderService implements OnModuleInit {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort
  ) {}

  onModuleInit() {
    if (!(this.auditRepository instanceof PostgresAuditRepository)) {
      setActiveAuditRuntimeRecorder(undefined);
      return;
    }

    setActiveAuditRuntimeRecorder({
      persist: async (event, metadata) => {
        if (this.auditRepository.saveEventWithMetadata) {
          await this.auditRepository.saveEventWithMetadata(event, metadata);
          return;
        }

        await this.auditRepository.saveEvent(event);
      }
    });
  }
}
