import { Controller, Get } from "@nestjs/common";
import { WaterQualityService } from "./water-quality.service";

@Controller("water-quality")
export class WaterQualityController {
  constructor(private readonly waterQualityService: WaterQualityService) {}

  @Get()
  getPlaceholder() {
    return this.waterQualityService.getPlaceholder();
  }
}
