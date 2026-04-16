import { Controller, Get } from "@nestjs/common";
import { RuntimeDiagnosticsService } from "./runtime-diagnostics.service";

@Controller("diagnostics")
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: RuntimeDiagnosticsService) {}

  @Get("runtime")
  getRuntimeDiagnostics() {
    return this.diagnosticsService.getRuntimeDiagnostics();
  }
}
