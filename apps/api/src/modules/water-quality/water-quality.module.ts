import { Module } from "@nestjs/common";
import { WaterQualityApplicationService } from "./application/water-quality.application-service";
import { WaterQualityController } from "./water-quality.controller";
import { WaterQualityService } from "./water-quality.service";

@Module({ controllers: [WaterQualityController], providers: [WaterQualityService, WaterQualityApplicationService], exports: [WaterQualityService, WaterQualityApplicationService] })
export class WaterQualityModule {}
