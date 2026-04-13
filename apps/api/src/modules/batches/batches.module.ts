import { Module } from "@nestjs/common";
import { BatchesApplicationService } from "./application/batches.application-service";
import { BatchesController } from "./batches.controller";
import { BATCHES_REPOSITORY } from "./ports/batches-repository.port";
import { BatchesService } from "./batches.service";
import { InMemoryBatchesRepository } from "./repositories/in-memory-batches.repository";

const BATCHES_PERSISTENCE_PROVIDER = { provide: BATCHES_REPOSITORY, useClass: InMemoryBatchesRepository };
const BATCHES_PROVIDERS = [BatchesService, BATCHES_PERSISTENCE_PROVIDER, BatchesApplicationService];
const BATCHES_EXPORTS = [BatchesService, BatchesApplicationService];

@Module({
  imports: [],
  controllers: [BatchesController],
  providers: BATCHES_PROVIDERS,
  exports: BATCHES_EXPORTS
})
export class BatchesModule {}
