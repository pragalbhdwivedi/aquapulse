import { Module } from "@nestjs/common";
import { createPersistenceAdapterProvider, resolveConfiguredPersistenceAdapter } from "../../common/persistence/persistence-adapter.types";
import { AlertsModule } from "../alerts/alerts.module";
import { PostgresAiRepository } from "./adapters/postgres-ai.repository";
import { AiApplicationService } from "./application/ai.application-service";
import { AiController } from "./ai.controller";
import { AI_REPOSITORY } from "./ports/ai-repository.port";
import { InMemoryAiRepository } from "./repositories/in-memory-ai.repository";
import { AlertExplanationService } from "./services/alert-explanation.service";
import { AiService } from "./ai.service";

export const AI_ADAPTER_REGISTRY = { inMemory: InMemoryAiRepository, postgres: PostgresAiRepository };
export const AI_ACTIVE_REPOSITORY = resolveConfiguredPersistenceAdapter(AI_ADAPTER_REGISTRY, {
  token: AI_REPOSITORY,
  defaultAdapter: "in-memory",
  allowRuntimeSwitch: true
});
export const AI_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(AI_REPOSITORY, AI_ACTIVE_REPOSITORY, {
  token: AI_REPOSITORY,
  defaultAdapter: "in-memory",
  allowRuntimeSwitch: true
});
export const AI_ADAPTERS = [AI_ADAPTER_REGISTRY.inMemory, AI_ADAPTER_REGISTRY.postgres];
const AI_PROVIDERS = [
  AiService,
  ...AI_ADAPTERS,
  AI_PERSISTENCE_PROVIDER,
  AlertExplanationService,
  AiApplicationService
];
const AI_EXPORTS = [AiService, AlertExplanationService, AiApplicationService];

@Module({
  imports: [AlertsModule],
  controllers: [AiController],
  providers: AI_PROVIDERS,
  exports: AI_EXPORTS
})
export class AiModule {}
