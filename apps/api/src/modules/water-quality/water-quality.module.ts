import { Module } from "@nestjs/common";
import { createPersistenceAdapterProvider } from "../../common/persistence/persistence-adapter.types";
import { PostgresWaterQualityRepository } from "./adapters/postgres-water-quality.repository";
import { WaterQualityApplicationService } from "./application/water-quality.application-service";
import { WATER_QUALITY_REPOSITORY } from "./ports/water-quality-repository.port";
import { InMemoryWaterQualityRepository } from "./repositories/in-memory-water-quality.repository";
import { WaterQualityController } from "./water-quality.controller";
import { WaterQualityService } from "./water-quality.service";

export const WATER_QUALITY_ACTIVE_REPOSITORY = InMemoryWaterQualityRepository;
export const WATER_QUALITY_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(
  WATER_QUALITY_REPOSITORY,
  WATER_QUALITY_ACTIVE_REPOSITORY
);
export const WATER_QUALITY_ADAPTERS = [InMemoryWaterQualityRepository, PostgresWaterQualityRepository];
const WATER_QUALITY_PROVIDERS = [WaterQualityService, ...WATER_QUALITY_ADAPTERS, WATER_QUALITY_PERSISTENCE_PROVIDER, WaterQualityApplicationService];
const WATER_QUALITY_EXPORTS = [WaterQualityService, WaterQualityApplicationService];

@Module({
  imports: [],
  controllers: [WaterQualityController],
  providers: WATER_QUALITY_PROVIDERS,
  exports: WATER_QUALITY_EXPORTS
})
export class WaterQualityModule {}
