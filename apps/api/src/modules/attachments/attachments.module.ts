import { Module } from "@nestjs/common";
import { AttachmentsApplicationService } from "./application/attachments.application-service";
import { AttachmentsController } from "./attachments.controller";
import { AttachmentsService } from "./attachments.service";

const ATTACHMENTS_PROVIDERS = [AttachmentsService, AttachmentsApplicationService];
const ATTACHMENTS_EXPORTS = [AttachmentsService, AttachmentsApplicationService];

@Module({
  imports: [],
  controllers: [AttachmentsController],
  providers: ATTACHMENTS_PROVIDERS,
  exports: ATTACHMENTS_EXPORTS
})
export class AttachmentsModule {}
