import { Module } from "@nestjs/common";
import { PondsApplicationService } from "./application/ponds.application-service";
import { PondsController } from "./ponds.controller";
import { PondsService } from "./ponds.service";

@Module({
  controllers: [PondsController],
  providers: [PondsService, PondsApplicationService],
  exports: [PondsService, PondsApplicationService]
})
export class PondsModule {}
