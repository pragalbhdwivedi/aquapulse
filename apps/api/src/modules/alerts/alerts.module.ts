import { Module } from "@nestjs/common";
import { createPersistenceAdapterProvider } from "../../common/persistence/persistence-adapter.types";
import { PostgresAlertsRepository } from "./adapters/postgres-alerts.repository";
import { AlertsApplicationService } from "./application/alerts.application-service";
import { AlertsController } from "./alerts.controller";
import { ALERTS_REPOSITORY } from "./ports/alerts-repository.port";
import { InMemoryAlertsRepository } from "./repositories/in-memory-alerts.repository";
import { AlertsService } from "./alerts.service";

export const ALERTS_ACTIVE_REPOSITORY = InMemoryAlertsRepository;
export const ALERTS_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(ALERTS_REPOSITORY, ALERTS_ACTIVE_REPOSITORY);
export const ALERTS_ADAPTERS = [InMemoryAlertsRepository, PostgresAlertsRepository];
const ALERTS_PROVIDERS = [AlertsService, ...ALERTS_ADAPTERS, ALERTS_PERSISTENCE_PROVIDER, AlertsApplicationService];
const ALERTS_EXPORTS = [AlertsService, AlertsApplicationService];

@Module({
  imports: [],
  controllers: [AlertsController],
  providers: ALERTS_PROVIDERS,
  exports: ALERTS_EXPORTS
})
export class AlertsModule {}
