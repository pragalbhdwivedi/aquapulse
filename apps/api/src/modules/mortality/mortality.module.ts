import { Module } from "@nestjs/common";
import { MortalityController } from "./mortality.controller";
import { MortalityService } from "./mortality.service";

@Module({
  controllers: [MortalityController],
  providers: [MortalityService],
})
export class MortalityModule {}
