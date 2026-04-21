import { Module } from "@nestjs/common";
import { createPersistenceAdapterProvider, resolveConfiguredPersistenceAdapter } from "../../common/persistence/persistence-adapter.types";
import { PostgresAlertsRepository } from "./adapters/postgres-alerts.repository";
import { AlertsApplicationService } from "./application/alerts.application-service";
import { AlertsController } from "./alerts.controller";
import { AlertsLiveUpdatesService } from "./live-updates/alerts-live-updates.service";
import { ALERTS_REPOSITORY } from "./ports/alerts-repository.port";
import { InMemoryAlertsRepository } from "./repositories/in-memory-alerts.repository";
import { AlertsService } from "./alerts.service";

export const ALERTS_ADAPTER_REGISTRY = { inMemory: InMemoryAlertsRepository, postgres: PostgresAlertsRepository };
export const ALERTS_ACTIVE_REPOSITORY = resolveConfiguredPersistenceAdapter(ALERTS_ADAPTER_REGISTRY, {
  token: ALERTS_REPOSITORY,
  defaultAdapter: "in-memory",
  allowRuntimeSwitch: true
});
export const ALERTS_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(ALERTS_REPOSITORY, ALERTS_ACTIVE_REPOSITORY, {
  token: ALERTS_REPOSITORY,
  defaultAdapter: "in-memory",
  allowRuntimeSwitch: true
});
export const ALERTS_ADAPTERS = [ALERTS_ADAPTER_REGISTRY.inMemory, ALERTS_ADAPTER_REGISTRY.postgres];
const ALERTS_PROVIDERS = [
  AlertsService,
  AlertsLiveUpdatesService,
  ...ALERTS_ADAPTERS,
  ALERTS_PERSISTENCE_PROVIDER,
  AlertsApplicationService
];
const ALERTS_EXPORTS = [AlertsService, AlertsApplicationService, AlertsLiveUpdatesService];

@Module({
  imports: [],
  controllers: [AlertsController],
  providers: ALERTS_PROVIDERS,
  exports: ALERTS_EXPORTS
})
export class AlertsModule {}
