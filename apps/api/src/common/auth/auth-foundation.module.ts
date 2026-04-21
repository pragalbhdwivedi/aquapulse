import { Global, Module } from "@nestjs/common";
import { ApiAuthService } from "./api-auth.service";
import { PlaceholderAuthGuard } from "./placeholder-auth.guard";
import { PlaceholderRoleGuard } from "./placeholder-role.guard";

@Global()
@Module({
  providers: [ApiAuthService, PlaceholderAuthGuard, PlaceholderRoleGuard],
  exports: [ApiAuthService, PlaceholderAuthGuard, PlaceholderRoleGuard]
})
export class AuthFoundationModule {}
