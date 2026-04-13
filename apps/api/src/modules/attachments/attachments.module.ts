import { Module } from "@nestjs/common";
import { createPersistenceAdapterProvider } from "../../common/persistence/persistence-adapter.types";
import { PostgresAttachmentsRepository } from "./adapters/postgres-attachments.repository";
import { AttachmentsApplicationService } from "./application/attachments.application-service";
import { AttachmentsController } from "./attachments.controller";
import { ATTACHMENTS_REPOSITORY } from "./ports/attachments-repository.port";
import { AttachmentsService } from "./attachments.service";
import { InMemoryAttachmentsRepository } from "./repositories/in-memory-attachments.repository";

export const ATTACHMENTS_ACTIVE_REPOSITORY = InMemoryAttachmentsRepository;
export const ATTACHMENTS_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(
  ATTACHMENTS_REPOSITORY,
  ATTACHMENTS_ACTIVE_REPOSITORY
);
export const ATTACHMENTS_ADAPTERS = [InMemoryAttachmentsRepository, PostgresAttachmentsRepository];
const ATTACHMENTS_PROVIDERS = [AttachmentsService, ...ATTACHMENTS_ADAPTERS, ATTACHMENTS_PERSISTENCE_PROVIDER, AttachmentsApplicationService];
const ATTACHMENTS_EXPORTS = [AttachmentsService, AttachmentsApplicationService];

@Module({
  imports: [],
  controllers: [AttachmentsController],
  providers: ATTACHMENTS_PROVIDERS,
  exports: ATTACHMENTS_EXPORTS
})
export class AttachmentsModule {}
