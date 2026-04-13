import { Module } from "@nestjs/common";
import { TreatmentsController } from "./treatments.controller";
import { TreatmentsService } from "./treatments.service";

@Module({
  controllers: [TreatmentsController],
  providers: [TreatmentsService],
  exports: [TreatmentsService],
})
export class TreatmentsModule {}
