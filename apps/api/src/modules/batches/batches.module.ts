import { Module } from "@nestjs/common";
import { BatchesApplicationService } from "./application/batches.application-service";
import { BatchesController } from "./batches.controller";
import { BatchesService } from "./batches.service";

@Module({ controllers: [BatchesController], providers: [BatchesService, BatchesApplicationService], exports: [BatchesService, BatchesApplicationService] })
export class BatchesModule {}
