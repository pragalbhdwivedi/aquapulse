import { Module } from "@nestjs/common";
import { createPersistenceAdapterProvider, resolveConfiguredPersistenceAdapter } from "../../common/persistence/persistence-adapter.types";
import { ResourceScopeModule } from "../resource-scope/resource-scope.module";
import { PostgresAttachmentsRepository } from "./adapters/postgres-attachments.repository";
import { AttachmentsApplicationService } from "./application/attachments.application-service";
import { AttachmentsController } from "./attachments.controller";
import { ATTACHMENTS_REPOSITORY } from "./ports/attachments-repository.port";
import { AttachmentsService } from "./attachments.service";
import { InMemoryAttachmentsRepository } from "./repositories/in-memory-attachments.repository";

export const ATTACHMENTS_ADAPTER_REGISTRY = {
  inMemory: InMemoryAttachmentsRepository,
  postgres: PostgresAttachmentsRepository
};
export const ATTACHMENTS_ACTIVE_REPOSITORY = resolveConfiguredPersistenceAdapter(ATTACHMENTS_ADAPTER_REGISTRY, {
  token: ATTACHMENTS_REPOSITORY,
  defaultAdapter: "in-memory",
  allowRuntimeSwitch: true
});
export const ATTACHMENTS_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(
  ATTACHMENTS_REPOSITORY,
  ATTACHMENTS_ACTIVE_REPOSITORY,
  { token: ATTACHMENTS_REPOSITORY, defaultAdapter: "in-memory", allowRuntimeSwitch: true }
);
export const ATTACHMENTS_ADAPTERS = [ATTACHMENTS_ADAPTER_REGISTRY.inMemory, ATTACHMENTS_ADAPTER_REGISTRY.postgres];
const ATTACHMENTS_PROVIDERS = [AttachmentsService, ...ATTACHMENTS_ADAPTERS, ATTACHMENTS_PERSISTENCE_PROVIDER, AttachmentsApplicationService];
const ATTACHMENTS_EXPORTS = [AttachmentsService, AttachmentsApplicationService];

@Module({
  imports: [ResourceScopeModule],
  controllers: [AttachmentsController],
  providers: ATTACHMENTS_PROVIDERS,
  exports: ATTACHMENTS_EXPORTS
})
export class AttachmentsModule {}
