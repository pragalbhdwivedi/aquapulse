import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { createForbiddenResponse } from "../api/response-mapper";
import { ApiAuthService } from "./api-auth.service";
import { AUTH_ROLE_METADATA_KEY } from "./require-roles.decorator";

@Injectable()
export class PlaceholderRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: ApiAuthService
  ) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(AUTH_ROLE_METADATA_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: Parameters<ApiAuthService["hasRequiredRoles"]>[0] }>();
    if (this.authService.hasRequiredRoles(request.user, requiredRoles)) {
      return true;
    }

    throw new ForbiddenException(createForbiddenResponse().error);
  }
}
