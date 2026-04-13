import { Module } from "@nestjs/common";
import { PondsApplicationService } from "./application/ponds.application-service";
import { PondsController } from "./ponds.controller";
import { PONDS_REPOSITORY } from "./ports/ponds-repository.port";
import { PondsService } from "./ponds.service";
import { InMemoryPondsRepository } from "./repositories/in-memory-ponds.repository";

const PONDS_PERSISTENCE_PROVIDER = { provide: PONDS_REPOSITORY, useClass: InMemoryPondsRepository };
const PONDS_PROVIDERS = [PondsService, PONDS_PERSISTENCE_PROVIDER, PondsApplicationService];
const PONDS_EXPORTS = [PondsService, PondsApplicationService];

@Module({
  imports: [],
  controllers: [PondsController],
  providers: PONDS_PROVIDERS,
  exports: PONDS_EXPORTS
})
export class PondsModule {}
