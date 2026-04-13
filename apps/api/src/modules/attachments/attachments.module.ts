import { Module } from "@nestjs/common";
import { AttachmentsApplicationService } from "./application/attachments.application-service";
import { AttachmentsController } from "./attachments.controller";
import { ATTACHMENTS_REPOSITORY } from "./ports/attachments-repository.port";
import { AttachmentsService } from "./attachments.service";
import { InMemoryAttachmentsRepository } from "./repositories/in-memory-attachments.repository";

const ATTACHMENTS_PERSISTENCE_PROVIDER = {
  provide: ATTACHMENTS_REPOSITORY,
  useClass: InMemoryAttachmentsRepository
};
const ATTACHMENTS_PROVIDERS = [AttachmentsService, ATTACHMENTS_PERSISTENCE_PROVIDER, AttachmentsApplicationService];
const ATTACHMENTS_EXPORTS = [AttachmentsService, AttachmentsApplicationService];

@Module({
  imports: [],
  controllers: [AttachmentsController],
  providers: ATTACHMENTS_PROVIDERS,
  exports: ATTACHMENTS_EXPORTS
})
export class AttachmentsModule {}
