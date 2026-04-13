import { Module } from "@nestjs/common";
import { AlertsApplicationService } from "./application/alerts.application-service";
import { AlertsController } from "./alerts.controller";
import { AlertsService } from "./alerts.service";

const ALERTS_PROVIDERS = [AlertsService, AlertsApplicationService];
const ALERTS_EXPORTS = [AlertsService, AlertsApplicationService];

@Module({
  imports: [],
  controllers: [AlertsController],
  providers: ALERTS_PROVIDERS,
  exports: ALERTS_EXPORTS
})
export class AlertsModule {}
