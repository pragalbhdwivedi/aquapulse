import { Module } from "@nestjs/common";
import { PondsController } from "./ponds.controller";
import { PondsService } from "./ponds.service";

@Module({
  controllers: [PondsController],
  providers: [PondsService],
  exports: [PondsService],
})
export class PondsModule {}
