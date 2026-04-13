import { Module } from "@nestjs/common";
import { createPersistenceAdapterProvider } from "../../common/persistence/persistence-adapter.types";
import { PostgresTasksRepository } from "./adapters/postgres-tasks.repository";
import { TasksApplicationService } from "./application/tasks.application-service";
import { TASKS_REPOSITORY } from "./ports/tasks-repository.port";
import { InMemoryTasksRepository } from "./repositories/in-memory-tasks.repository";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

export const TASKS_ACTIVE_REPOSITORY = InMemoryTasksRepository;
export const TASKS_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(TASKS_REPOSITORY, TASKS_ACTIVE_REPOSITORY);
export const TASKS_ADAPTERS = [InMemoryTasksRepository, PostgresTasksRepository];
const TASKS_PROVIDERS = [TasksService, ...TASKS_ADAPTERS, TASKS_PERSISTENCE_PROVIDER, TasksApplicationService];
const TASKS_EXPORTS = [TasksService, TasksApplicationService];

@Module({
  imports: [],
  controllers: [TasksController],
  providers: TASKS_PROVIDERS,
  exports: TASKS_EXPORTS
})
export class TasksModule {}
