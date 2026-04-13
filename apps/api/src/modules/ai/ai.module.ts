import { Module } from "@nestjs/common";
import { createPersistenceAdapterProvider } from "../../common/persistence/persistence-adapter.types";
import { PostgresAiRepository } from "./adapters/postgres-ai.repository";
import { AiApplicationService } from "./application/ai.application-service";
import { AiController } from "./ai.controller";
import { AI_REPOSITORY } from "./ports/ai-repository.port";
import { InMemoryAiRepository } from "./repositories/in-memory-ai.repository";
import { AiService } from "./ai.service";

export const AI_ACTIVE_REPOSITORY = InMemoryAiRepository;
export const AI_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(AI_REPOSITORY, AI_ACTIVE_REPOSITORY);
export const AI_ADAPTERS = [InMemoryAiRepository, PostgresAiRepository];
const AI_PROVIDERS = [AiService, ...AI_ADAPTERS, AI_PERSISTENCE_PROVIDER, AiApplicationService];
const AI_EXPORTS = [AiService, AiApplicationService];

@Module({
  imports: [],
  controllers: [AiController],
  providers: AI_PROVIDERS,
  exports: AI_EXPORTS
})
export class AiModule {}
