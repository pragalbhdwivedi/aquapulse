import { Module } from "@nestjs/common";
import { AuditApplicationService } from "./application/audit.application-service";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";

@Module({ controllers: [AuditController], providers: [AuditService, AuditApplicationService], exports: [AuditService, AuditApplicationService] })
export class AuditModule {}
