import { Module } from "@nestjs/common";
import { AiApplicationService } from "./application/ai.application-service";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";

const AI_PROVIDERS = [AiService, AiApplicationService];
const AI_EXPORTS = [AiService, AiApplicationService];

@Module({
  imports: [],
  controllers: [AiController],
  providers: AI_PROVIDERS,
  exports: AI_EXPORTS
})
export class AiModule {}
