import { Module } from "@nestjs/common";
import { WaterQualityApplicationService } from "./application/water-quality.application-service";
import { WaterQualityController } from "./water-quality.controller";
import { WaterQualityService } from "./water-quality.service";

const WATER_QUALITY_PROVIDERS = [WaterQualityService, WaterQualityApplicationService];
const WATER_QUALITY_EXPORTS = [WaterQualityService, WaterQualityApplicationService];

@Module({
  imports: [],
  controllers: [WaterQualityController],
  providers: WATER_QUALITY_PROVIDERS,
  exports: WATER_QUALITY_EXPORTS
})
export class WaterQualityModule {}
