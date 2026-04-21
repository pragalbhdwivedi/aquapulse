import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { createUnauthorizedResponse } from "../api/response-mapper";
import { ApiAuthService } from "./api-auth.service";

@Injectable()
export class PlaceholderAuthGuard implements CanActivate {
  constructor(private readonly authService: ApiAuthService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const user = this.authService.hydrateRequestUser(request);

    if (!this.authService.requiresAuthentication()) {
      return true;
    }

    if (user) {
      return true;
    }

    throw new UnauthorizedException(createUnauthorizedResponse().error);
  }
}
