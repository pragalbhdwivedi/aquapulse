import { Module } from "@nestjs/common";
import { createPersistenceAdapterProvider } from "../../common/persistence/persistence-adapter.types";
import { PostgresBatchesRepository } from "./adapters/postgres-batches.repository";
import { BatchesApplicationService } from "./application/batches.application-service";
import { BatchesController } from "./batches.controller";
import { BATCHES_REPOSITORY } from "./ports/batches-repository.port";
import { BatchesService } from "./batches.service";
import { InMemoryBatchesRepository } from "./repositories/in-memory-batches.repository";

export const BATCHES_ACTIVE_REPOSITORY = InMemoryBatchesRepository;
export const BATCHES_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(BATCHES_REPOSITORY, BATCHES_ACTIVE_REPOSITORY);
export const BATCHES_ADAPTERS = [InMemoryBatchesRepository, PostgresBatchesRepository];
const BATCHES_PROVIDERS = [BatchesService, ...BATCHES_ADAPTERS, BATCHES_PERSISTENCE_PROVIDER, BatchesApplicationService];
const BATCHES_EXPORTS = [BatchesService, BatchesApplicationService];

@Module({
  imports: [],
  controllers: [BatchesController],
  providers: BATCHES_PROVIDERS,
  exports: BATCHES_EXPORTS
})
export class BatchesModule {}
