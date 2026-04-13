import { Module } from "@nestjs/common";
import { AttachmentsApplicationService } from "./application/attachments.application-service";
import { AttachmentsController } from "./attachments.controller";
import { AttachmentsService } from "./attachments.service";

@Module({ controllers: [AttachmentsController], providers: [AttachmentsService, AttachmentsApplicationService], exports: [AttachmentsService, AttachmentsApplicationService] })
export class AttachmentsModule {}
