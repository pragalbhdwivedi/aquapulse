import { Module } from "@nestjs/common";
import { AiApplicationService } from "./application/ai.application-service";
import { AiController } from "./ai.controller";
import { AI_REPOSITORY } from "./ports/ai-repository.port";
import { InMemoryAiRepository } from "./repositories/in-memory-ai.repository";
import { AiService } from "./ai.service";

const AI_PERSISTENCE_PROVIDER = { provide: AI_REPOSITORY, useClass: InMemoryAiRepository };
const AI_PROVIDERS = [AiService, AI_PERSISTENCE_PROVIDER, AiApplicationService];
const AI_EXPORTS = [AiService, AiApplicationService];

@Module({
  imports: [],
  controllers: [AiController],
  providers: AI_PROVIDERS,
  exports: AI_EXPORTS
})
export class AiModule {}
