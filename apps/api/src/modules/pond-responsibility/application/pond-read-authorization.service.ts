import { Inject, Injectable } from "@nestjs/common";
import {
  POND_RESPONSIBILITY_REPOSITORY,
  type PondResponsibilityRepositoryPort
} from "../ports/pond-responsibility-repository.port";
import type { PondAuthorizationActor } from "../pond-responsibility.models";

function shouldEnforcePondReadScope(
  actor: PondAuthorizationActor | undefined
): actor is PondAuthorizationActor & { readonly provider: "keycloak" } {
  return actor?.provider === "keycloak" && actor.id.trim().length > 0;
}

@Injectable()
export class PondReadAuthorizationService {
  constructor(
    @Inject(POND_RESPONSIBILITY_REPOSITORY)
    private readonly pondResponsibilityRepository: PondResponsibilityRepositoryPort
  ) {}

  async canReadPond(
    actor: PondAuthorizationActor | undefined,
    pondId: string,
    at = new Date().toISOString()
  ): Promise<boolean> {
    if (!shouldEnforcePondReadScope(actor)) {
      return true;
    }

    return this.pondResponsibilityRepository.hasActiveResponsibility(actor.id, pondId, at);
  }

  async listReadablePondIds(
    actor: PondAuthorizationActor | undefined,
    at = new Date().toISOString()
  ): Promise<readonly string[] | undefined> {
    if (!shouldEnforcePondReadScope(actor)) {
      return undefined;
    }

    const responsibilities = await this.pondResponsibilityRepository.listActiveByUserId(actor.id, at);
    return [...new Set(responsibilities.map((item) => item.pondId))];
  }
}
