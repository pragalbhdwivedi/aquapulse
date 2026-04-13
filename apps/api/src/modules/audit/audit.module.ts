import { Module } from "@nestjs/common";
import { createPersistenceAdapterProvider } from "../../common/persistence/persistence-adapter.types";
import { PostgresAuditRepository } from "./adapters/postgres-audit.repository";
import { AuditApplicationService } from "./application/audit.application-service";
import { AuditController } from "./audit.controller";
import { AUDIT_REPOSITORY } from "./ports/audit-repository.port";
import { AuditService } from "./audit.service";
import { InMemoryAuditRepository } from "./repositories/in-memory-audit.repository";

export const AUDIT_ACTIVE_REPOSITORY = InMemoryAuditRepository;
export const AUDIT_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(AUDIT_REPOSITORY, AUDIT_ACTIVE_REPOSITORY);
export const AUDIT_ADAPTERS = [InMemoryAuditRepository, PostgresAuditRepository];
const AUDIT_PROVIDERS = [AuditService, ...AUDIT_ADAPTERS, AUDIT_PERSISTENCE_PROVIDER, AuditApplicationService];
const AUDIT_EXPORTS = [AuditService, AuditApplicationService];

@Module({
  imports: [],
  controllers: [AuditController],
  providers: AUDIT_PROVIDERS,
  exports: AUDIT_EXPORTS
})
export class AuditModule {}
