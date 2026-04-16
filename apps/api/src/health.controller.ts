import { Controller, Get } from "@nestjs/common";
import { RuntimeDiagnosticsService } from "./runtime-diagnostics.service";

@Controller("health")
export class HealthController {
  constructor(private readonly diagnosticsService: RuntimeDiagnosticsService) {}

  @Get()
  getHealth() {
    return this.diagnosticsService.getHealthDiagnostics();
  }
}
