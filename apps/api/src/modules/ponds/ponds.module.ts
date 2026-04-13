import { Module } from "@nestjs/common";
import { createPersistenceAdapterProvider } from "../../common/persistence/persistence-adapter.types";
import { PostgresPondsRepository } from "./adapters/postgres-ponds.repository";
import { PondsApplicationService } from "./application/ponds.application-service";
import { PondsController } from "./ponds.controller";
import { PONDS_REPOSITORY } from "./ports/ponds-repository.port";
import { PondsService } from "./ponds.service";
import { InMemoryPondsRepository } from "./repositories/in-memory-ponds.repository";

export const PONDS_ACTIVE_REPOSITORY = InMemoryPondsRepository;
export const PONDS_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(PONDS_REPOSITORY, PONDS_ACTIVE_REPOSITORY);
export const PONDS_ADAPTERS = [InMemoryPondsRepository, PostgresPondsRepository];
const PONDS_PROVIDERS = [PondsService, ...PONDS_ADAPTERS, PONDS_PERSISTENCE_PROVIDER, PondsApplicationService];
const PONDS_EXPORTS = [PondsService, PondsApplicationService];

@Module({
  imports: [],
  controllers: [PondsController],
  providers: PONDS_PROVIDERS,
  exports: PONDS_EXPORTS
})
export class PondsModule {}
