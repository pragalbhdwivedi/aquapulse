import { Global, Module } from "@nestjs/common";
import { ApiAuthService } from "./api-auth.service";
import { CurrentSessionService } from "./current-session.service";
import { PlaceholderAuthGuard } from "./placeholder-auth.guard";
import { PlaceholderRoleGuard } from "./placeholder-role.guard";

@Global()
@Module({
  providers: [ApiAuthService, CurrentSessionService, PlaceholderAuthGuard, PlaceholderRoleGuard],
  exports: [ApiAuthService, CurrentSessionService, PlaceholderAuthGuard, PlaceholderRoleGuard]
})
export class AuthFoundationModule {}
