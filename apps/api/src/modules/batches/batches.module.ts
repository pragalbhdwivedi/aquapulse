import { Module } from "@nestjs/common";
import { BatchesApplicationService } from "./application/batches.application-service";
import { BatchesController } from "./batches.controller";
import { BatchesService } from "./batches.service";

const BATCHES_PROVIDERS = [BatchesService, BatchesApplicationService];
const BATCHES_EXPORTS = [BatchesService, BatchesApplicationService];

@Module({
  imports: [],
  controllers: [BatchesController],
  providers: BATCHES_PROVIDERS,
  exports: BATCHES_EXPORTS
})
export class BatchesModule {}
