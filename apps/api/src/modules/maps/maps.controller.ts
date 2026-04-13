import { Controller, Get } from "@nestjs/common";
import { MapsService } from "./maps.service";

@Controller("maps")
export class MapsController {
  constructor(private readonly mapService: MapsService) {}

  @Get()
  getPlaceholder() {
    return this.mapService.getPlaceholder();
  }
}
