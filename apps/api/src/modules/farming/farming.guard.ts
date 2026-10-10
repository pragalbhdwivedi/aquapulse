import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { ApiAuthService } from "../../common/auth/api-auth.service";
import { FarmingService } from "./farming.service";

export const FARMING_ENV = Symbol("FARMING_ENV");
@Injectable()
export class FarmingGuard implements CanActivate {
  constructor(
    @Inject(ApiAuthService) private readonly auth: ApiAuthService,
    @Inject(FarmingService) private readonly farming: FarmingService,
    @Inject(FARMING_ENV)
    private readonly env: Record<string, string | undefined>,
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const config = this.auth.getRuntimeConfig();
    const production = this.env.NODE_ENV === "production";
    if (
      production &&
      (this.farming.demo ||
        this.farming.store.mode !== "postgres" ||
        config.requestedMode !== "keycloak" ||
        config.effectiveMode !== "keycloak")
    )
      throw new ServiceUnavailableException(
        "Farming requires PostgreSQL and verified Keycloak authentication in production.",
      );
    if (
      production &&
      (!config.keycloak.issuerUrl?.startsWith("https://") ||
        !config.keycloak.jwksUrl?.startsWith("https://"))
    )
      throw new ServiceUnavailableException(
        "Production farming authentication requires HTTPS issuer and JWKS endpoints.",
      );
    if (
      this.farming.demo &&
      !production &&
      config.requestedMode === "disabled"
    ) {
      request.farmActor = "farm-demo-owner";
      return true;
    }
    // Local identity headers can be forged. They are never accepted by this module.
    if (
      config.effectiveMode !== "keycloak" ||
      !config.keycloak.verificationAvailable
    )
      throw new ServiceUnavailableException(
        "Configure verified Keycloak authentication or explicitly enable the isolated local farming demo.",
      );
    const user = await this.auth.hydrateRequestUser(request);
    const audience = config.keycloak.audience || config.keycloak.clientId;
    if (
      !user ||
      user.provider !== "keycloak" ||
      user.claims.iss !== config.keycloak.issuerUrl ||
      typeof user.claims.exp !== "number" ||
      user.claims.exp * 1000 <= Date.now() ||
      !audience ||
      !Array.isArray(user.claims.aud) ||
      !user.claims.aud.includes(audience)
    )
      throw new UnauthorizedException(
        "A verified farming session with issuer, audience and expiry is required.",
      );
    request.farmActor = user.id;
    return true;
  }
}
