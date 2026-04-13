import { Module } from "@nestjs/common";
import { TasksApplicationService } from "./application/tasks.application-service";
import { TASKS_REPOSITORY } from "./ports/tasks-repository.port";
import { InMemoryTasksRepository } from "./repositories/in-memory-tasks.repository";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

const TASKS_PERSISTENCE_PROVIDER = { provide: TASKS_REPOSITORY, useClass: InMemoryTasksRepository };
const TASKS_PROVIDERS = [TasksService, TASKS_PERSISTENCE_PROVIDER, TasksApplicationService];
const TASKS_EXPORTS = [TasksService, TasksApplicationService];

@Module({
  imports: [],
  controllers: [TasksController],
  providers: TASKS_PROVIDERS,
  exports: TASKS_EXPORTS
})
export class TasksModule {}
