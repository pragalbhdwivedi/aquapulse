import { Controller, Get } from "@nestjs/common";
import { IntegrationsService } from "./integrations.service";

@Controller("integrations")
export class IntegrationsController {
  constructor(private readonly integrationService: IntegrationsService) {}

  @Get()
  getPlaceholder() {
    return this.integrationService.getPlaceholder();
  }
}
