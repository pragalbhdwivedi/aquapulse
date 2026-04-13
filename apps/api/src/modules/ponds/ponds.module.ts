import { Module } from "@nestjs/common";
import { PondsApplicationService } from "./application/ponds.application-service";
import { PondsController } from "./ponds.controller";
import { PondsService } from "./ponds.service";

const PONDS_PROVIDERS = [PondsService, PondsApplicationService];
const PONDS_EXPORTS = [PondsService, PondsApplicationService];

@Module({
  imports: [],
  controllers: [PondsController],
  providers: PONDS_PROVIDERS,
  exports: PONDS_EXPORTS
})
export class PondsModule {}
