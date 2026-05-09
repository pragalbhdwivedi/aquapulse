import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import type { AuthenticatedUserSession, EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuthGuard } from "./common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "./common/auth/placeholder-role.guard";
import { CurrentSessionService } from "./common/auth/current-session.service";
import { createSuccessResponse } from "./common/api/response-mapper";

@Controller("auth")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
export class AuthController {
  constructor(private readonly currentSessionService: CurrentSessionService) {}

  @Get("session")
  async getCurrentSession(
    @Req()
    request: {
      readonly headers?: Record<string, string | string[] | undefined>;
      user?: AuthenticatedUserSession | null;
    }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.auth.session>> {
    return createSuccessResponse(await this.currentSessionService.getCurrentSession(request));
  }
}
