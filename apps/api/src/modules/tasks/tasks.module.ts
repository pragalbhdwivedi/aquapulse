import { Module } from "@nestjs/common";
import { createPersistenceAdapterProvider, resolveConfiguredPersistenceAdapter } from "../../common/persistence/persistence-adapter.types";
import { PostgresTasksRepository } from "./adapters/postgres-tasks.repository";
import { TasksApplicationService } from "./application/tasks.application-service";
import { TASKS_REPOSITORY } from "./ports/tasks-repository.port";
import { InMemoryTasksRepository } from "./repositories/in-memory-tasks.repository";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

export const TASKS_ADAPTER_REGISTRY = { inMemory: InMemoryTasksRepository, postgres: PostgresTasksRepository };
export const TASKS_ACTIVE_REPOSITORY = resolveConfiguredPersistenceAdapter(TASKS_ADAPTER_REGISTRY, {
  token: TASKS_REPOSITORY,
  defaultAdapter: "in-memory",
  allowRuntimeSwitch: true
});
export const TASKS_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(TASKS_REPOSITORY, TASKS_ACTIVE_REPOSITORY, {
  token: TASKS_REPOSITORY,
  defaultAdapter: "in-memory",
  allowRuntimeSwitch: true
});
export const TASKS_ADAPTERS = [TASKS_ADAPTER_REGISTRY.inMemory, TASKS_ADAPTER_REGISTRY.postgres];
const TASKS_PROVIDERS = [TasksService, ...TASKS_ADAPTERS, TASKS_PERSISTENCE_PROVIDER, TasksApplicationService];
const TASKS_EXPORTS = [TasksService, TasksApplicationService];

@Module({
  imports: [],
  controllers: [TasksController],
  providers: TASKS_PROVIDERS,
  exports: TASKS_EXPORTS
})
export class TasksModule {}
