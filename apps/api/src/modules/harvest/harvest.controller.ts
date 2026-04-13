import { Controller, Get } from "@nestjs/common";
import { HarvestService } from "./harvest.service";

@Controller("harvest")
export class HarvestController {
  constructor(private readonly harvestService: HarvestService) {}

  @Get()
  getPlaceholder() {
    return this.harvestService.getPlaceholder();
  }
}
