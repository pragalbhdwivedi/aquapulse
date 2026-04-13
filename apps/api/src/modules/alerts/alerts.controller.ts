import { Controller, Get } from "@nestjs/common";
import { AlertsService } from "./alerts.service";

@Controller("alerts")
export class AlertsController {
  constructor(private readonly alertService: AlertsService) {}

  @Get()
  getPlaceholder() {
    return this.alertService.getPlaceholder();
  }
}
