import { Module } from "@nestjs/common";
import { createPersistenceAdapterProvider, resolveConfiguredPersistenceAdapter } from "../../common/persistence/persistence-adapter.types";
import { PostgresAuditRepository } from "./adapters/postgres-audit.repository";
import { AuditApplicationService } from "./application/audit.application-service";
import { AuditController } from "./audit.controller";
import { AUDIT_REPOSITORY } from "./ports/audit-repository.port";
import { AuditService } from "./audit.service";
import { InMemoryAuditRepository } from "./repositories/in-memory-audit.repository";

export const AUDIT_ADAPTER_REGISTRY = { inMemory: InMemoryAuditRepository, postgres: PostgresAuditRepository };
export const AUDIT_ACTIVE_REPOSITORY = resolveConfiguredPersistenceAdapter(AUDIT_ADAPTER_REGISTRY, {
  token: AUDIT_REPOSITORY,
  defaultAdapter: "in-memory",
  allowRuntimeSwitch: true
});
export const AUDIT_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(AUDIT_REPOSITORY, AUDIT_ACTIVE_REPOSITORY, {
  token: AUDIT_REPOSITORY,
  defaultAdapter: "in-memory",
  allowRuntimeSwitch: true
});
export const AUDIT_ADAPTERS = [AUDIT_ADAPTER_REGISTRY.inMemory, AUDIT_ADAPTER_REGISTRY.postgres];
const AUDIT_PROVIDERS = [AuditService, ...AUDIT_ADAPTERS, AUDIT_PERSISTENCE_PROVIDER, AuditApplicationService];
const AUDIT_EXPORTS = [AuditService, AuditApplicationService];

@Module({
  imports: [],
  controllers: [AuditController],
  providers: AUDIT_PROVIDERS,
  exports: AUDIT_EXPORTS
})
export class AuditModule {}
