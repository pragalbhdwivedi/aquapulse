import { Module } from "@nestjs/common";
import { AuditApplicationService } from "./application/audit.application-service";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";

const AUDIT_PROVIDERS = [AuditService, AuditApplicationService];
const AUDIT_EXPORTS = [AuditService, AuditApplicationService];

@Module({
  imports: [],
  controllers: [AuditController],
  providers: AUDIT_PROVIDERS,
  exports: AUDIT_EXPORTS
})
export class AuditModule {}
