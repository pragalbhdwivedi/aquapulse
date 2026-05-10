import { Module } from "@nestjs/common";
import {
  createPersistenceAdapterProvider,
  resolveConfiguredPersistenceAdapter
} from "../../common/persistence/persistence-adapter.types";
import { PostgresPondResponsibilityRepository } from "./adapters/postgres-pond-responsibility.repository";
import { PondReadAuthorizationService } from "./application/pond-read-authorization.service";
import { POND_RESPONSIBILITY_REPOSITORY } from "./ports/pond-responsibility-repository.port";
import { InMemoryPondResponsibilityRepository } from "./repositories/in-memory-pond-responsibility.repository";

export const POND_RESPONSIBILITY_ADAPTER_REGISTRY = {
  inMemory: InMemoryPondResponsibilityRepository,
  postgres: PostgresPondResponsibilityRepository
};
export const POND_RESPONSIBILITY_ACTIVE_REPOSITORY = resolveConfiguredPersistenceAdapter(
  POND_RESPONSIBILITY_ADAPTER_REGISTRY,
  {
    token: POND_RESPONSIBILITY_REPOSITORY,
    defaultAdapter: "in-memory",
    allowRuntimeSwitch: true
  }
);
export const POND_RESPONSIBILITY_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(
  POND_RESPONSIBILITY_REPOSITORY,
  POND_RESPONSIBILITY_ACTIVE_REPOSITORY,
  {
    token: POND_RESPONSIBILITY_REPOSITORY,
    defaultAdapter: "in-memory",
    allowRuntimeSwitch: true
  }
);
export const POND_RESPONSIBILITY_ADAPTERS = [
  POND_RESPONSIBILITY_ADAPTER_REGISTRY.inMemory,
  POND_RESPONSIBILITY_ADAPTER_REGISTRY.postgres
];
const POND_RESPONSIBILITY_PROVIDERS = [
  ...POND_RESPONSIBILITY_ADAPTERS,
  POND_RESPONSIBILITY_PERSISTENCE_PROVIDER,
  PondReadAuthorizationService
];
const POND_RESPONSIBILITY_EXPORTS = [PondReadAuthorizationService];

@Module({
  imports: [],
  providers: POND_RESPONSIBILITY_PROVIDERS,
  exports: POND_RESPONSIBILITY_EXPORTS
})
export class PondResponsibilityModule {}
