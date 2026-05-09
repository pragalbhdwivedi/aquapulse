import { Controller, Get, UseGuards } from "@nestjs/common";
import { PlaceholderAuthGuard } from "./common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "./common/auth/placeholder-role.guard";
import { RequireAuthentication } from "./common/auth/auth-slice.decorator";
import { RuntimeDiagnosticsService } from "./runtime-diagnostics.service";

@Controller("diagnostics")
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: RuntimeDiagnosticsService) {}

  @Get("runtime")
  @RequireAuthentication()
  @UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
  getRuntimeDiagnostics() {
    return this.diagnosticsService.getRuntimeDiagnostics();
  }
}
