import { Module } from "@nestjs/common";
import { WaterQualityApplicationService } from "./application/water-quality.application-service";
import { WATER_QUALITY_REPOSITORY } from "./ports/water-quality-repository.port";
import { InMemoryWaterQualityRepository } from "./repositories/in-memory-water-quality.repository";
import { WaterQualityController } from "./water-quality.controller";
import { WaterQualityService } from "./water-quality.service";

const WATER_QUALITY_PERSISTENCE_PROVIDER = {
  provide: WATER_QUALITY_REPOSITORY,
  useClass: InMemoryWaterQualityRepository
};
const WATER_QUALITY_PROVIDERS = [WaterQualityService, WATER_QUALITY_PERSISTENCE_PROVIDER, WaterQualityApplicationService];
const WATER_QUALITY_EXPORTS = [WaterQualityService, WaterQualityApplicationService];

@Module({
  imports: [],
  controllers: [WaterQualityController],
  providers: WATER_QUALITY_PROVIDERS,
  exports: WATER_QUALITY_EXPORTS
})
export class WaterQualityModule {}
