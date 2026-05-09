import { Module } from "@nestjs/common";
import { createPersistenceAdapterProvider, resolveConfiguredPersistenceAdapter } from "../../common/persistence/persistence-adapter.types";
import { AlertsModule } from "../alerts/alerts.module";
import { PondResponsibilityModule } from "../pond-responsibility/pond-responsibility.module";
import { PostgresWaterQualityRepository } from "./adapters/postgres-water-quality.repository";
import { WaterQualityApplicationService } from "./application/water-quality.application-service";
import { WATER_QUALITY_REPOSITORY } from "./ports/water-quality-repository.port";
import { InMemoryWaterQualityRepository } from "./repositories/in-memory-water-quality.repository";
import { WaterQualityController } from "./water-quality.controller";
import { WaterQualityService } from "./water-quality.service";

export const WATER_QUALITY_ADAPTER_REGISTRY = {
  inMemory: InMemoryWaterQualityRepository,
  postgres: PostgresWaterQualityRepository
};
export const WATER_QUALITY_ACTIVE_REPOSITORY = resolveConfiguredPersistenceAdapter(WATER_QUALITY_ADAPTER_REGISTRY, {
  token: WATER_QUALITY_REPOSITORY,
  defaultAdapter: "in-memory",
  allowRuntimeSwitch: true
});
export const WATER_QUALITY_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(
  WATER_QUALITY_REPOSITORY,
  WATER_QUALITY_ACTIVE_REPOSITORY,
  { token: WATER_QUALITY_REPOSITORY, defaultAdapter: "in-memory", allowRuntimeSwitch: true }
);
export const WATER_QUALITY_ADAPTERS = [WATER_QUALITY_ADAPTER_REGISTRY.inMemory, WATER_QUALITY_ADAPTER_REGISTRY.postgres];
const WATER_QUALITY_PROVIDERS = [WaterQualityService, ...WATER_QUALITY_ADAPTERS, WATER_QUALITY_PERSISTENCE_PROVIDER, WaterQualityApplicationService];
const WATER_QUALITY_EXPORTS = [WaterQualityService, WaterQualityApplicationService];

@Module({
  imports: [AlertsModule, PondResponsibilityModule],
  controllers: [WaterQualityController],
  providers: WATER_QUALITY_PROVIDERS,
  exports: WATER_QUALITY_EXPORTS
})
export class WaterQualityModule {}
