import { Module } from "@nestjs/common";
import { AuditApplicationService } from "./application/audit.application-service";
import { AuditController } from "./audit.controller";
import { AUDIT_REPOSITORY } from "./ports/audit-repository.port";
import { AuditService } from "./audit.service";
import { InMemoryAuditRepository } from "./repositories/in-memory-audit.repository";

const AUDIT_PERSISTENCE_PROVIDER = { provide: AUDIT_REPOSITORY, useClass: InMemoryAuditRepository };
const AUDIT_PROVIDERS = [AuditService, AUDIT_PERSISTENCE_PROVIDER, AuditApplicationService];
const AUDIT_EXPORTS = [AuditService, AuditApplicationService];

@Module({
  imports: [],
  controllers: [AuditController],
  providers: AUDIT_PROVIDERS,
  exports: AUDIT_EXPORTS
})
export class AuditModule {}
