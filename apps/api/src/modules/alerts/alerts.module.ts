import { Module } from "@nestjs/common";
import { AlertsApplicationService } from "./application/alerts.application-service";
import { AlertsController } from "./alerts.controller";
import { ALERTS_REPOSITORY } from "./ports/alerts-repository.port";
import { InMemoryAlertsRepository } from "./repositories/in-memory-alerts.repository";
import { AlertsService } from "./alerts.service";

const ALERTS_PERSISTENCE_PROVIDER = { provide: ALERTS_REPOSITORY, useClass: InMemoryAlertsRepository };
const ALERTS_PROVIDERS = [AlertsService, ALERTS_PERSISTENCE_PROVIDER, AlertsApplicationService];
const ALERTS_EXPORTS = [AlertsService, AlertsApplicationService];

@Module({
  imports: [],
  controllers: [AlertsController],
  providers: ALERTS_PROVIDERS,
  exports: ALERTS_EXPORTS
})
export class AlertsModule {}
