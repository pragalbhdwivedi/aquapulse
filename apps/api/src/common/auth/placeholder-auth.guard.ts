import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { createUnauthorizedResponse } from "../api/response-mapper";
import { ApiAuthService } from "./api-auth.service";
import { AUTH_REQUIRED_METADATA_KEY } from "./auth-slice.decorator";
import { AUTH_ROLE_METADATA_KEY } from "./require-roles.decorator";

@Injectable()
export class PlaceholderAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: ApiAuthService
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const user = await this.authService.hydrateRequestUser(request);
    const requiresAuth =
      this.reflector.getAllAndOverride<boolean>(AUTH_REQUIRED_METADATA_KEY, [
        context.getHandler(),
        context.getClass()
      ]) === true;
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(AUTH_ROLE_METADATA_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? [];

    if (!this.authService.requiresAuthentication()) {
      return true;
    }

    if (!requiresAuth && requiredRoles.length === 0) {
      return true;
    }

    if (user) {
      return true;
    }

    throw new UnauthorizedException(createUnauthorizedResponse().error);
  }
}
