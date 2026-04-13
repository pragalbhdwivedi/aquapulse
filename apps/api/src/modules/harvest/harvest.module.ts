import { Module } from "@nestjs/common";
import { HarvestController } from "./harvest.controller";
import { HarvestService } from "./harvest.service";

@Module({
  controllers: [HarvestController],
  providers: [HarvestService],
})
export class HarvestModule {}
