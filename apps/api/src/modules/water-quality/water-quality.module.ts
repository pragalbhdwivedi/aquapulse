import { Module } from "@nestjs/common";
import { WaterQualityController } from "./water-quality.controller";
import { WaterQualityService } from "./water-quality.service";

@Module({
  controllers: [WaterQualityController],
  providers: [WaterQualityService],
  exports: [WaterQualityService],
})
export class WaterQualityModule {}
